from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.asset_type import AssetTypeCreate, AssetTypeRead, AssetTypeUpdate
from app.services.asset_type_service import AssetTypeService

router = APIRouter(prefix="/asset-types", tags=["Asset Types"])


@router.get("", response_model=list[AssetTypeRead])
def list_asset_types(db: Session = Depends(get_db)) -> list[AssetTypeRead]:
    return AssetTypeService(db).list()


@router.post("", response_model=AssetTypeRead, status_code=status.HTTP_201_CREATED)
def create_asset_type(payload: AssetTypeCreate, db: Session = Depends(get_db)) -> AssetTypeRead:
    return AssetTypeService(db).create(payload)


@router.get("/{asset_type_id}", response_model=AssetTypeRead)
def get_asset_type(asset_type_id: int, db: Session = Depends(get_db)) -> AssetTypeRead:
    return AssetTypeService(db).get(asset_type_id)


@router.put("/{asset_type_id}", response_model=AssetTypeRead)
def update_asset_type(
    asset_type_id: int, payload: AssetTypeUpdate, db: Session = Depends(get_db)
) -> AssetTypeRead:
    return AssetTypeService(db).update(asset_type_id, payload)


@router.delete("/{asset_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset_type(asset_type_id: int, db: Session = Depends(get_db)) -> None:
    AssetTypeService(db).delete(asset_type_id)
