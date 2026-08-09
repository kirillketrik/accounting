from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.asset_status import AssetStatusCreate, AssetStatusRead, AssetStatusUpdate
from app.services.asset_status_service import AssetStatusService

router = APIRouter(prefix="/asset-statuses", tags=["Asset Statuses"])


@router.get("", response_model=list[AssetStatusRead])
def list_asset_statuses(db: Session = Depends(get_db)) -> list[AssetStatusRead]:
    return AssetStatusService(db).list()


@router.post("", response_model=AssetStatusRead, status_code=status.HTTP_201_CREATED)
def create_asset_status(
    payload: AssetStatusCreate, db: Session = Depends(get_db)
) -> AssetStatusRead:
    return AssetStatusService(db).create(payload)


@router.get("/{asset_status_id}", response_model=AssetStatusRead)
def get_asset_status(asset_status_id: int, db: Session = Depends(get_db)) -> AssetStatusRead:
    return AssetStatusService(db).get(asset_status_id)


@router.put("/{asset_status_id}", response_model=AssetStatusRead)
def update_asset_status(
    asset_status_id: int, payload: AssetStatusUpdate, db: Session = Depends(get_db)
) -> AssetStatusRead:
    return AssetStatusService(db).update(asset_status_id, payload)


@router.delete("/{asset_status_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset_status(asset_status_id: int, db: Session = Depends(get_db)) -> None:
    AssetStatusService(db).delete(asset_status_id)
