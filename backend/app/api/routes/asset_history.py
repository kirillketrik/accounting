from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.asset_history import AssetHistoryRead
from app.schemas.common import PaginatedResponse
from app.services.asset_history_service import AssetHistoryService

router = APIRouter(prefix="/asset-history", tags=["Asset History"])


@router.get("", response_model=PaginatedResponse[AssetHistoryRead])
def list_asset_history(
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[AssetHistoryRead]:
    items, total = AssetHistoryService(db).list(page=page, page_size=page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{history_id}", response_model=AssetHistoryRead)
def get_asset_history(history_id: int, db: Session = Depends(get_db)) -> AssetHistoryRead:
    return AssetHistoryService(db).get(history_id)
