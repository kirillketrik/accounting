from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.asset import Asset
from app.models.asset_custom_field_value import AssetCustomFieldValue
from app.models.asset_type import AssetType
from app.models.place import Place
from app.models.user import User
from app.repositories.asset import AssetRepository
from app.repositories.asset_custom_field_definition import AssetCustomFieldDefinitionRepository
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
    AssetBulkPreviewItem,
    AssetBulkPreviewResult,
    AssetBulkResult,
    AssetCreate,
    AssetUpdate,
)
from app.schemas.asset_custom_field import (
    AssetCustomFieldValueInput,
    CustomFieldType,
    CustomFieldValue,
    serialize_value_for_storage,
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


class AssetService:
    def __init__(self, db: Session) -> None:
        self.repo = AssetRepository(db)
        self.asset_type_repo = AssetTypeRepository(db)
        self.status_repo = AssetStatusRepository(db)
        self.place_repo = PlaceRepository(db)
        self.event_repo = AssetEventRepository(db)
        self.naming_rule_repo = AssetNamingRuleRepository(db)
        self.custom_field_definition_repo = AssetCustomFieldDefinitionRepository(db)
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

    def _inventory_number_in_use(self, inventory_number: int, asset_type_id: int) -> Asset | None:
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

    def _validate_custom_field_values(
        self,
        asset_type_id: int,
        inputs: list[AssetCustomFieldValueInput],
        *,
        existing: dict[int, str | None] | None = None,
    ) -> dict[int, tuple[CustomFieldType, CustomFieldValue]]:
        """Checks every submitted definition_id belongs to asset_type_id and every
        required definition for that type has a non-empty value. Raises before any
        DB write so a validation failure never leaves a partially-created/updated asset.

        `existing` is the asset's current stored values (definition_id -> raw stored
        string) before this call, or None when creating a brand new asset. Required-ness
        is always enforced on create (existing=None). On update, a required field that's
        missing is only rejected if it *wasn't already* missing beforehand — otherwise
        adding/marking a field required after the fact would permanently block editing
        every pre-existing asset of that type (even for changes unrelated to custom
        fields) until someone manually backfills it. Actively clearing a previously-filled
        required field is still rejected.
        """
        definitions = {
            d.id: d for d in self.custom_field_definition_repo.list_by_asset_type(asset_type_id)
        }

        provided: dict[int, CustomFieldValue] = {}
        for item in inputs:
            definition = definitions.get(item.definition_id)
            if definition is None:
                raise ConflictError(
                    f"Custom field {item.definition_id} does not belong to this asset type"
                )
            provided[item.definition_id] = item.value

        for definition in definitions.values():
            if not definition.is_required:
                continue
            value = provided.get(definition.id)
            is_missing = definition.id not in provided or value is None or value == ""
            if not is_missing:
                continue
            if existing is not None and existing.get(definition.id) in (None, ""):
                continue  # was already missing before this update — not a new problem
            raise ConflictError(f"Custom field '{definition.name}' is required")

        return {
            definition_id: (CustomFieldType(definitions[definition_id].field_type), value)
            for definition_id, value in provided.items()
        }

    def _build_custom_field_value_rows(
        self, asset_type_id: int, inputs: list[AssetCustomFieldValueInput]
    ) -> list[AssetCustomFieldValue]:
        resolved = self._validate_custom_field_values(asset_type_id, inputs)
        return [
            AssetCustomFieldValue(
                definition_id=definition_id,
                value=serialize_value_for_storage(value, field_type),
            )
            for definition_id, (field_type, value) in resolved.items()
        ]

    def _apply_custom_field_values(
        self, obj: Asset, asset_type_id: int, inputs: list[AssetCustomFieldValueInput]
    ) -> None:
        """Upserts obj.custom_field_values in place from the submitted inputs. Values
        for definitions no longer present in `inputs` are dropped (cascade="all,
        delete-orphan" on Asset.custom_field_values handles the row deletion on flush).
        """
        existing_raw = {v.definition_id: v.value for v in obj.custom_field_values}
        resolved = self._validate_custom_field_values(asset_type_id, inputs, existing=existing_raw)
        existing_by_definition = {v.definition_id: v for v in obj.custom_field_values}
        kept: list[AssetCustomFieldValue] = []
        for definition_id, (field_type, value) in resolved.items():
            stored = serialize_value_for_storage(value, field_type)
            existing = existing_by_definition.get(definition_id)
            if existing is not None:
                existing.value = stored
                kept.append(existing)
            else:
                kept.append(AssetCustomFieldValue(definition_id=definition_id, value=stored))
        obj.custom_field_values = kept

    def _next_inventory_number(self, asset_type_id: int, seen: set[int]) -> int:
        """Generate the next free inventory number for this asset type.

        Autogenerated numbers are plain integers (1, 2, ...), unique among assets
        of the same type, continuing from the highest existing value.
        """
        existing = self.repo.list_inventory_numbers(asset_type_id)
        last_num = max(existing, default=0)

        candidate = last_num + 1
        while True:
            if candidate not in seen and not self._inventory_number_in_use(
                candidate, asset_type_id
            ):
                return candidate
            candidate += 1

    def create(self, data: AssetCreate, current_user: User) -> Asset:
        asset_type = self._get_asset_type_or_raise(data.asset_type_id)
        if data.inventory_number is not None and self._inventory_number_in_use(
            data.inventory_number, data.asset_type_id
        ):
            raise ConflictError(f"Inventory number '{data.inventory_number}' already in use")
        if data.status_id is not None:
            self._get_status_or_raise(data.status_id)
        if data.place_id is not None:
            self._get_place_or_raise(data.place_id)
        payload = data.model_dump(exclude={"custom_field_values"})
        payload["inventory_number"] = (
            data.inventory_number
            if data.inventory_number is not None
            else self._next_inventory_number(data.asset_type_id, set())
        )
        payload["name"] = self._default_name(data.name, data.serial_number, asset_type)
        payload["status_id"] = data.status_id or self._resolve_default_status_id()
        payload["responsible_user_id"] = current_user.id
        payload["custom_field_values"] = self._build_custom_field_value_rows(
            data.asset_type_id, data.custom_field_values
        )
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
        payload = data.model_dump(exclude_unset=True, exclude={"custom_field_values"})
        payload["responsible_user_id"] = current_user.id
        if "asset_type_id" in payload:
            self._get_asset_type_or_raise(payload["asset_type_id"])
        if payload.get("status_id") is not None:
            self._get_status_or_raise(payload["status_id"])
        if payload.get("place_id") is not None:
            self._get_place_or_raise(payload["place_id"])
        if payload.get("inventory_number") is not None:
            asset_type_id = payload.get("asset_type_id", obj.asset_type_id)
            existing = self._inventory_number_in_use(payload["inventory_number"], asset_type_id)
            if existing is not None and existing.id != id_:
                raise ConflictError(
                    f"Inventory number '{payload['inventory_number']}' already in use"
                )

        before = {key: getattr(obj, key) for key in payload}
        before_cf = {f"custom_field:{v.definition_id}": v.value for v in obj.custom_field_values}

        changing_type = "asset_type_id" in payload and payload["asset_type_id"] != obj.asset_type_id
        if data.custom_field_values is not None or changing_type:
            # Values are scoped to a specific asset type's definitions. If the type is
            # changing and the caller didn't resend custom_field_values, treat it as []
            # rather than silently keeping the old type's values (and skipping required-
            # field validation) attached to an asset that no longer has that type.
            new_values = data.custom_field_values if data.custom_field_values is not None else []
            asset_type_id = payload.get("asset_type_id", obj.asset_type_id)
            self._apply_custom_field_values(obj, asset_type_id, new_values)

        self.repo.update(obj, **payload)

        changes = diff_fields(before, payload)
        after_cf = {f"custom_field:{v.definition_id}": v.value for v in obj.custom_field_values}
        # diff_fields only iterates `after`'s keys, so a field dropped entirely (present
        # in before_cf, absent from after_cf) needs an explicit None entry to be detected.
        for key in before_cf:
            after_cf.setdefault(key, None)
        changes.update(diff_fields(before_cf, after_cf))

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
        seen_inventory_numbers: set[int] = set()

        for index, item in enumerate(data.items):
            inv = item.inventory_number
            try:
                if inv is not None:
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
                if inv is not None:
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

    def bulk_preview(self, data: AssetBulkCreate, current_user: User) -> AssetBulkPreviewResult:
        """Resolves what `bulk_create` would produce for each item without persisting
        anything, so the UI can show real names/inventory numbers (which may depend on
        naming rules) before committing the batch.
        """
        asset_type = self._get_asset_type_or_raise(data.asset_type_id)
        default_status = self.status_repo.get_default()
        if default_status is None:
            raise ConflictError("No default asset status is configured")

        items: list[AssetBulkPreviewItem] = []
        seen_inventory_numbers: set[int] = set()

        for index, item in enumerate(data.items):
            inv = item.inventory_number
            error: str | None = None
            try:
                if inv is not None:
                    if inv in seen_inventory_numbers:
                        raise ConflictError(
                            f"Inventory number '{inv}' duplicated within this batch"
                        )
                    if self._inventory_number_in_use(inv, data.asset_type_id):
                        raise ConflictError(f"Inventory number '{inv}' already in use")
                else:
                    inv = self._next_inventory_number(data.asset_type_id, seen_inventory_numbers)
            except ConflictError as exc:
                error = str(exc)

            if error is None and inv is not None:
                seen_inventory_numbers.add(inv)

            items.append(
                AssetBulkPreviewItem(
                    index=index,
                    name=self._default_name(item.name, item.serial_number, asset_type),
                    inventory_number=inv,
                    serial_number=item.serial_number,
                    asset_type=asset_type,
                    status=default_status,
                    responsible_user=current_user,
                    error=error,
                )
            )

        return AssetBulkPreviewResult(items=items)

    def event_counters(self, id_: int) -> list[EventCounter]:
        if self.repo.get(id_) is None:
            raise NotFoundError("Asset", id_)
        counters = []
        for event_type, count in self.event_repo.counts_for_asset(id_):
            if not event_type.counter_label:
                continue
            label = event_type.counter_label.replace("{n}", str(count))
            counters.append(
                EventCounter(
                    event_type_id=event_type.id,
                    event_type_name=event_type.name,
                    count=count,
                    label=label,
                )
            )
        return counters
