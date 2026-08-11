from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.asset_event import (
    AssetEventBulkApply,
    AssetEventBulkPreviewResult,
    AssetEventBulkResolveRequest,
    AssetEventBulkResult,
    AssetEventUpdate,
    AssetEventWithType,
)
from app.services.asset_event_service import AssetEventService

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("/bulk", response_model=AssetEventBulkResult)
def bulk_apply_events(
    payload: AssetEventBulkApply,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssetEventBulkResult:
    return AssetEventService(db).bulk_apply(payload, current_user)


@router.post("/bulk/preview", response_model=AssetEventBulkPreviewResult)
def preview_bulk_events(
    payload: AssetEventBulkResolveRequest, db: Session = Depends(get_db)
) -> AssetEventBulkPreviewResult:
    return AssetEventService(db).bulk_preview(payload)


@router.put("/{event_id}", response_model=AssetEventWithType)
def update_event(
    event_id: int,
    payload: AssetEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssetEventWithType:
    return AssetEventService(db).update(event_id, payload, current_user)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: Session = Depends(get_db)) -> None:
    AssetEventService(db).delete(event_id)
