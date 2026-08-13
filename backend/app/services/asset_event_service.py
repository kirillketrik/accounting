from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.asset import Asset
from app.models.asset_event import AssetEvent
from app.models.user import User
from app.repositories.asset import AssetRepository
from app.repositories.asset_event import AssetEventRepository
from app.repositories.asset_history import AssetHistoryRepository
from app.repositories.event_type import EventTypeRepository
from app.schemas.asset_event import (
    AssetEventBulkApply,
    AssetEventBulkCreated,
    AssetEventBulkError,
    AssetEventBulkPreviewItem,
    AssetEventBulkPreviewResult,
    AssetEventBulkResolveRequest,
    AssetEventBulkResult,
    AssetEventCreate,
    AssetEventUpdate,
    AssetEventWithType,
)
from app.services.asset_service import ASSET_AUDIT_FIELDS
from app.services.audit_log_service import AuditLogService, diff_fields, snapshot

EVENT_AUDIT_FIELDS = [
    "asset_id",
    "event_type_id",
    "event_date",
    "description",
    "performed_by_user_id",
]


def _full_name(user: User | None) -> str | None:
    return user.full_name if user else None


class AssetEventService:
    def __init__(self, db: Session) -> None:
        self.repo = AssetEventRepository(db)
        self.asset_repo = AssetRepository(db)
        self.event_type_repo = EventTypeRepository(db)
        self.history_repo = AssetHistoryRepository(db)
        self.audit = AuditLogService(db)

    def _ensure_asset_exists(self, asset_id: int) -> None:
        if self.asset_repo.get(asset_id) is None:
            raise NotFoundError("Asset", asset_id)

    def _ensure_event_type_exists(self, event_type_id: int) -> None:
        if self.event_type_repo.get(event_type_id) is None:
            raise NotFoundError("EventType", event_type_id)

    def list_for_asset(self, asset_id: int) -> list[AssetEvent]:
        self._ensure_asset_exists(asset_id)
        return self.repo.list_for_asset(asset_id)

    def get(self, id_: int) -> AssetEvent:
        obj = self.repo.get(id_)
        if obj is None:
            raise NotFoundError("AssetEvent", id_)
        return obj

    def create(
        self,
        asset_id: int,
        data: AssetEventCreate,
        current_user: User,
        *,
        action: str = "create",
    ) -> AssetEventWithType:
        asset = self.asset_repo.get(asset_id)
        if asset is None:
            raise NotFoundError("Asset", asset_id)
        event_type = self.event_type_repo.get(data.event_type_id)
        if event_type is None:
            raise NotFoundError("EventType", data.event_type_id)

        event = self.repo.create(
            asset_id=asset_id, performed_by_user_id=current_user.id, **data.model_dump()
        )
        response = AssetEventWithType.model_validate(event)
        self.audit.record(
            entity_type="asset_event",
            entity_id=event.id,
            entity_name=f"{event_type.name}: {asset.name}",
            action=action,
            changes={"created": snapshot(event, EVENT_AUDIT_FIELDS)},
        )

        self.asset_repo.update(asset, status_id=event_type.target_status_id)

        if event_type.target_status.is_disposal:
            self._archive_and_delete(asset)

        return response

    def _archive_and_delete(self, asset: Asset) -> None:
        events = self.repo.list_for_asset(asset.id)
        latest_event = events[0] if events else None
        asset_id = asset.id
        entity_name = asset.name
        asset_snapshot = snapshot(asset, ASSET_AUDIT_FIELDS)
        history = self.history_repo.create(
            asset_name=asset.name,
            asset_type_name=asset.asset_type.name,
            inventory_number=asset.inventory_number,
            serial_number=asset.serial_number,
            place_name=asset.place.name if asset.place else None,
            responsible_person=_full_name(asset.responsible_user),
            notes=asset.notes,
            asset_created_at=asset.created_at,
            disposed_at=latest_event.event_date if latest_event else asset.created_at,
            events=[
                {
                    "event_type_name": event.event_type.name,
                    "event_date": event.event_date.isoformat(),
                    "description": event.description,
                    "performed_by": _full_name(event.performed_by_user),
                    "created_at": event.created_at.isoformat(),
                }
                for event in reversed(events)
            ],
        )
        self.asset_repo.delete(asset)
        self.audit.record(
            entity_type="asset",
            entity_id=asset_id,
            entity_name=entity_name,
            action="archive",
            changes={"deleted": asset_snapshot, "asset_history_id": history.id},
        )

    def _resolve_targets(
        self, asset_ids: list[int], inventory_numbers: list[int], asset_type_id: int | None
    ) -> tuple[list[Asset], list[int]]:
        """Merges assets picked explicitly by id with assets matched by inventory
        number, scoped to asset_type_id since inventory numbers are only unique
        within a type. Stale ids that no longer exist are dropped silently rather
        than erroring the whole batch.
        """
        by_inventory = self.asset_repo.list_by_inventory_numbers(inventory_numbers, asset_type_id)
        found_numbers = {a.inventory_number for a in by_inventory if a.inventory_number is not None}
        not_found = [n for n in inventory_numbers if n not in found_numbers]

        merged: dict[int, Asset] = {}
        for asset in self.asset_repo.list_by_ids(asset_ids) + by_inventory:
            merged[asset.id] = asset

        return list(merged.values()), not_found

    def bulk_preview(self, data: AssetEventBulkResolveRequest) -> AssetEventBulkPreviewResult:
        assets, not_found = self._resolve_targets(
            data.asset_ids, data.inventory_numbers, data.asset_type_id
        )
        items = [
            AssetEventBulkPreviewItem(
                asset_id=asset.id,
                asset_name=asset.name,
                asset_type=asset.asset_type,
                inventory_number=asset.inventory_number,
                status=asset.status,
            )
            for asset in assets
        ]
        return AssetEventBulkPreviewResult(items=items, not_found=not_found)

    def bulk_apply(self, data: AssetEventBulkApply, current_user: User) -> AssetEventBulkResult:
        self._ensure_event_type_exists(data.event_type_id)
        assets, not_found = self._resolve_targets(
            data.asset_ids, data.inventory_numbers, data.asset_type_id
        )

        created: list[AssetEventBulkCreated] = []
        errors: list[AssetEventBulkError] = [
            AssetEventBulkError(
                inventory_number=inv, message="Актив с таким инвентарным номером не найден"
            )
            for inv in not_found
        ]

        for asset in assets:
            asset_name_before = asset.name
            inventory_number = asset.inventory_number
            event_payload = AssetEventCreate(
                event_type_id=data.event_type_id,
                event_date=data.event_date,
                description=data.description,
            )
            event_with_type = self.create(
                asset.id, event_payload, current_user, action="bulk_create"
            )
            created.append(
                AssetEventBulkCreated(
                    asset_id=asset.id,
                    asset_name=asset_name_before,
                    inventory_number=inventory_number,
                    event=event_with_type,
                )
            )

        return AssetEventBulkResult(created=created, errors=errors)

    def update(self, id_: int, data: AssetEventUpdate, current_user: User) -> AssetEvent:
        obj = self.get(id_)
        payload = data.model_dump(exclude_unset=True)
        payload["performed_by_user_id"] = current_user.id
        if "event_type_id" in payload:
            self._ensure_event_type_exists(payload["event_type_id"])
        before = {key: getattr(obj, key) for key in payload}
        updated = self.repo.update(obj, **payload)
        changes = diff_fields(before, payload)
        if changes:
            self.audit.record(
                entity_type="asset_event",
                entity_id=id_,
                entity_name=f"{updated.event_type.name}: {updated.asset.name}",
                action="update",
                changes=changes,
            )
        return updated

    def delete(self, id_: int) -> None:
        obj = self.get(id_)
        entity_name = f"{obj.event_type.name}: {obj.asset.name}"
        deleted_snapshot = snapshot(obj, EVENT_AUDIT_FIELDS)
        self.repo.delete(obj)
        self.audit.record(
            entity_type="asset_event",
            entity_id=id_,
            entity_name=entity_name,
            action="delete",
            changes={"deleted": deleted_snapshot},
        )
