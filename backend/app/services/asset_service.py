from __future__ import annotations

import re

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.asset import Asset
from app.models.asset_type import AssetType
from app.models.place import Place
from app.models.user import User
from app.repositories.asset import AssetRepository
from app.repositories.asset_event import AssetEventRepository
from app.repositories.asset_naming_rule import AssetNamingRuleRepository
from app.repositories.asset_status import AssetStatusRepository
from app.repositories.asset_type import AssetTypeRepository
from app.repositories.place import PlaceRepository
from app.schemas.asset import (
    AssetBulkCreate,
    AssetBulkDeleteError,
    AssetBulkDeleteResult,
    AssetBulkError,
    AssetBulkResult,
    AssetCreate,
    AssetUpdate,
)
from app.schemas.event_counter import EventCounter
from app.services.audit_log_service import AuditLogService, diff_fields, snapshot

ASSET_AUDIT_FIELDS = [
    "name",
    "asset_type_id",
    "inventory_number",
    "serial_number",
    "status_id",
    "place_id",
    "responsible_user_id",
    "notes",
]

_TRAILING_NUMBER_RE = re.compile(r"^(.*?)(\d+)$")
_DEFAULT_INVENTORY_PREFIX = "INV-"
_DEFAULT_INVENTORY_WIDTH = 4


class AssetService:
    def __init__(self, db: Session) -> None:
        self.repo = AssetRepository(db)
        self.asset_type_repo = AssetTypeRepository(db)
        self.status_repo = AssetStatusRepository(db)
        self.place_repo = PlaceRepository(db)
        self.event_repo = AssetEventRepository(db)
        self.naming_rule_repo = AssetNamingRuleRepository(db)
        self.audit = AuditLogService(db)

    def list(
        self,
        *,
        search: str | None = None,
        status_id: int | None = None,
        asset_type_id: int | None = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Asset], int]:
        return self.repo.search(
            search=search,
            status_id=status_id,
            asset_type_id=asset_type_id,
            sort_by=sort_by,
            sort_dir=sort_dir,
            page=page,
            page_size=page_size,
        )

    def list_for_export(
        self, *, status_id: int | None = None, asset_type_id: int | None = None
    ) -> list[Asset]:
        return self.repo.list_for_export(status_id=status_id, asset_type_id=asset_type_id)

    def get(self, id_: int) -> Asset:
        obj = self.repo.get_with_type(id_)
        if obj is None:
            raise NotFoundError("Asset", id_)
        return obj

    def _get_asset_type_or_raise(self, asset_type_id: int) -> AssetType:
        asset_type = self.asset_type_repo.get(asset_type_id)
        if asset_type is None:
            raise NotFoundError("AssetType", asset_type_id)
        return asset_type

    def _get_status_or_raise(self, status_id: int) -> None:
        if self.status_repo.get(status_id) is None:
            raise NotFoundError("AssetStatus", status_id)

    def _get_place_or_raise(self, place_id: int) -> Place:
        place = self.place_repo.get(place_id)
        if place is None:
            raise NotFoundError("Place", place_id)
        return place

    def _resolve_default_status_id(self) -> int:
        default_status = self.status_repo.get_default()
        if default_status is None:
            raise ConflictError("No default asset status is configured")
        return default_status.id

    def _inventory_number_in_use(self, inventory_number: str, asset_type_id: int) -> Asset | None:
        return self.repo.get_by_inventory_number_and_type(inventory_number, asset_type_id)

    def _default_name(
        self, name: str | None, serial_number: str | None, asset_type: AssetType
    ) -> str:
        if name:
            return name
        if serial_number:
            rule = self.naming_rule_repo.get_active_match(asset_type.id, serial_number)
            if rule:
                return rule.name_result
            return f"{serial_number} {asset_type.name}".strip()
        return asset_type.name

    def _next_inventory_number(self, asset_type_id: int, seen: set[str]) -> str:
        """Generate the next free inventory number for this asset type.

        Mirrors the numbering style of the highest existing inventory number for the
        type (prefix + zero-padded digits), defaulting to "INV-0001" when none exist.
        """
        prefix, width, last_num = _DEFAULT_INVENTORY_PREFIX, _DEFAULT_INVENTORY_WIDTH, 0
        for inv in self.repo.list_inventory_numbers(asset_type_id):
            match = _TRAILING_NUMBER_RE.match(inv)
            if not match:
                continue
            digits = match.group(2)
            num = int(digits)
            if num >= last_num:
                prefix, width, last_num = match.group(1), len(digits), num

        candidate_num = last_num + 1
        while True:
            candidate = f"{prefix}{str(candidate_num).zfill(width)}"
            if candidate not in seen and not self._inventory_number_in_use(
                candidate, asset_type_id
            ):
                return candidate
            candidate_num += 1

    def create(self, data: AssetCreate, current_user: User) -> Asset:
        asset_type = self._get_asset_type_or_raise(data.asset_type_id)
        if data.inventory_number and self._inventory_number_in_use(
            data.inventory_number, data.asset_type_id
        ):
            raise ConflictError(f"Inventory number '{data.inventory_number}' already in use")
        if data.status_id is not None:
            self._get_status_or_raise(data.status_id)
        if data.place_id is not None:
            self._get_place_or_raise(data.place_id)
        payload = data.model_dump()
        payload["inventory_number"] = data.inventory_number or self._next_inventory_number(
            data.asset_type_id, set()
        )
        payload["name"] = self._default_name(data.name, data.serial_number, asset_type)
        payload["status_id"] = data.status_id or self._resolve_default_status_id()
        payload["responsible_user_id"] = current_user.id
        obj = self.repo.create(**payload)
        self.audit.record(
            entity_type="asset",
            entity_id=obj.id,
            entity_name=obj.name,
            action="create",
            changes={"created": snapshot(obj, ASSET_AUDIT_FIELDS)},
        )
        return self.get(obj.id)

    def update(self, id_: int, data: AssetUpdate, current_user: User) -> Asset:
        obj = self.get(id_)
        payload = data.model_dump(exclude_unset=True)
        payload["responsible_user_id"] = current_user.id
        if "asset_type_id" in payload:
            self._get_asset_type_or_raise(payload["asset_type_id"])
        if payload.get("status_id") is not None:
            self._get_status_or_raise(payload["status_id"])
        if payload.get("place_id") is not None:
            self._get_place_or_raise(payload["place_id"])
        if payload.get("inventory_number"):
            asset_type_id = payload.get("asset_type_id", obj.asset_type_id)
            existing = self._inventory_number_in_use(payload["inventory_number"], asset_type_id)
            if existing is not None and existing.id != id_:
                raise ConflictError(
                    f"Inventory number '{payload['inventory_number']}' already in use"
                )
        before = {key: getattr(obj, key) for key in payload}
        self.repo.update(obj, **payload)
        changes = diff_fields(before, payload)
        if changes:
            self.audit.record(
                entity_type="asset",
                entity_id=id_,
                entity_name=obj.name,
                action="update",
                changes=changes,
            )
        return self.get(id_)

    def delete(self, id_: int) -> None:
        obj = self.get(id_)
        entity_name = obj.name
        deleted_snapshot = snapshot(obj, ASSET_AUDIT_FIELDS)
        self.repo.delete(obj)
        self.audit.record(
            entity_type="asset",
            entity_id=id_,
            entity_name=entity_name,
            action="delete",
            changes={"deleted": deleted_snapshot},
        )

    def bulk_delete(self, ids: list[int]) -> AssetBulkDeleteResult:
        deleted_ids: list[int] = []
        errors: list[AssetBulkDeleteError] = []
        for id_ in ids:
            obj = self.repo.get_with_type(id_)
            if obj is None:
                errors.append(AssetBulkDeleteError(id=id_, message="Актив не найден"))
                continue
            entity_name = obj.name
            deleted_snapshot = snapshot(obj, ASSET_AUDIT_FIELDS)
            self.repo.delete(obj)
            self.audit.record(
                entity_type="asset",
                entity_id=id_,
                entity_name=entity_name,
                action="bulk_delete",
                changes={"deleted": deleted_snapshot},
            )
            deleted_ids.append(id_)
        return AssetBulkDeleteResult(deleted_ids=deleted_ids, errors=errors)

    def bulk_create(self, data: AssetBulkCreate, current_user: User) -> AssetBulkResult:
        asset_type = self._get_asset_type_or_raise(data.asset_type_id)
        default_status_id = self._resolve_default_status_id()

        created: list[Asset] = []
        errors: list[AssetBulkError] = []
        seen_inventory_numbers: set[str] = set()

        for index, item in enumerate(data.items):
            inv = item.inventory_number
            try:
                if inv:
                    if inv in seen_inventory_numbers:
                        raise ConflictError(
                            f"Inventory number '{inv}' duplicated within this batch"
                        )
                    if self._inventory_number_in_use(inv, data.asset_type_id):
                        raise ConflictError(f"Inventory number '{inv}' already in use")
                else:
                    inv = self._next_inventory_number(data.asset_type_id, seen_inventory_numbers)
                name = self._default_name(item.name, item.serial_number, asset_type)
                obj = self.repo.create(
                    asset_type_id=data.asset_type_id,
                    name=name,
                    inventory_number=inv,
                    serial_number=item.serial_number,
                    responsible_user_id=current_user.id,
                    status_id=default_status_id,
                )
                if inv:
                    seen_inventory_numbers.add(inv)
                self.audit.record(
                    entity_type="asset",
                    entity_id=obj.id,
                    entity_name=obj.name,
                    action="bulk_create",
                    changes={"created": snapshot(obj, ASSET_AUDIT_FIELDS)},
                )
                created.append(self.get(obj.id))
            except ConflictError as exc:
                errors.append(AssetBulkError(index=index, message=str(exc)))
                self.repo.db.rollback()

        return AssetBulkResult(created=created, errors=errors)

    def event_counters(self, id_: int) -> list[EventCounter]:
        if self.repo.get(id_) is None:
            raise NotFoundError("Asset", id_)
        counters = []
        for event_type, count in self.event_repo.counts_for_asset(id_):
            label = (
                event_type.counter_label.replace("{n}", str(count))
                if event_type.counter_label
                else f"{event_type.name}: {count}"
            )
            counters.append(
                EventCounter(
                    event_type_id=event_type.id,
                    event_type_name=event_type.name,
                    count=count,
                    label=label,
                )
            )
        return counters
