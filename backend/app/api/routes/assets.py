from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.asset import (
    AssetBulkCreate,
    AssetBulkDeleteRequest,
    AssetBulkDeleteResult,
    AssetBulkResult,
    AssetCreate,
    AssetUpdate,
    AssetWithType,
)
from app.schemas.asset_event import AssetEventCreate, AssetEventWithType
from app.schemas.common import PaginatedResponse
from app.schemas.event_counter import EventCounter
from app.services.asset_event_service import AssetEventService
from app.services.asset_service import AssetService

router = APIRouter(prefix="/assets", tags=["Assets"])

SortBy = Literal[
    "name", "inventory_number", "status", "place", "responsible_user", "created_at", "asset_type"
]
SortDir = Literal["asc", "desc"]


@router.get("", response_model=PaginatedResponse[AssetWithType])
def list_assets(
    db: Session = Depends(get_db),
    search: str | None = Query(default=None),
    status_id: int | None = Query(default=None),
    asset_type_id: int | None = Query(default=None),
    sort_by: SortBy = Query(default="created_at"),
    sort_dir: SortDir = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[AssetWithType]:
    items, total = AssetService(db).list(
        search=search,
        status_id=status_id,
        asset_type_id=asset_type_id,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=AssetWithType, status_code=status.HTTP_201_CREATED)
def create_asset(
    payload: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssetWithType:
    return AssetService(db).create(payload, current_user)


@router.post("/bulk", response_model=AssetBulkResult)
def bulk_create_assets(
    payload: AssetBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssetBulkResult:
    return AssetService(db).bulk_create(payload, current_user)


@router.post("/bulk-delete", response_model=AssetBulkDeleteResult)
def bulk_delete_assets(
    payload: AssetBulkDeleteRequest, db: Session = Depends(get_db)
) -> AssetBulkDeleteResult:
    return AssetService(db).bulk_delete(payload.ids)


@router.get("/export", response_model=list[AssetWithType])
def export_assets(
    db: Session = Depends(get_db),
    status_id: int | None = Query(default=None),
    asset_type_id: int | None = Query(default=None),
) -> list[AssetWithType]:
    return AssetService(db).list_for_export(status_id=status_id, asset_type_id=asset_type_id)


@router.get("/{asset_id}", response_model=AssetWithType)
def get_asset(asset_id: int, db: Session = Depends(get_db)) -> AssetWithType:
    return AssetService(db).get(asset_id)


@router.put("/{asset_id}", response_model=AssetWithType)
def update_asset(
    asset_id: int,
    payload: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssetWithType:
    return AssetService(db).update(asset_id, payload, current_user)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(asset_id: int, db: Session = Depends(get_db)) -> None:
    AssetService(db).delete(asset_id)


@router.get("/{asset_id}/events", response_model=list[AssetEventWithType])
def list_asset_events(asset_id: int, db: Session = Depends(get_db)) -> list[AssetEventWithType]:
    return AssetEventService(db).list_for_asset(asset_id)


@router.get("/{asset_id}/event-counters", response_model=list[EventCounter])
def get_asset_event_counters(asset_id: int, db: Session = Depends(get_db)) -> list[EventCounter]:
    return AssetService(db).event_counters(asset_id)


@router.post(
    "/{asset_id}/events", response_model=AssetEventWithType, status_code=status.HTTP_201_CREATED
)
def create_asset_event(
    asset_id: int,
    payload: AssetEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssetEventWithType:
    return AssetEventService(db).create(asset_id, payload, current_user)
