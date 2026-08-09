from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.asset_event import (
    AssetEventBulkCreate,
    AssetEventBulkResult,
    AssetEventUpdate,
    AssetEventWithType,
)
from app.services.asset_event_service import AssetEventService

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("/bulk", response_model=AssetEventBulkResult)
def bulk_create_events(
    payload: AssetEventBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssetEventBulkResult:
    return AssetEventService(db).bulk_create_by_inventory_number(payload, current_user)


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
