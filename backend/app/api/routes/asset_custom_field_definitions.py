from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.models.user import User
from app.schemas.asset_custom_field import (
    AssetCustomFieldDefinitionCreate,
    AssetCustomFieldDefinitionRead,
    AssetCustomFieldDefinitionUpdate,
)
from app.services.asset_custom_field_definition_service import AssetCustomFieldDefinitionService

router = APIRouter(prefix="/asset-custom-field-definitions", tags=["Asset Custom Field Definitions"])


@router.get("", response_model=list[AssetCustomFieldDefinitionRead])
def list_asset_custom_field_definitions(
    db: Session = Depends(get_db),
    asset_type_id: int | None = Query(default=None),
) -> list[AssetCustomFieldDefinitionRead]:
    return AssetCustomFieldDefinitionService(db).list(asset_type_id)


@router.post(
    "", response_model=AssetCustomFieldDefinitionRead, status_code=status.HTTP_201_CREATED
)
def create_asset_custom_field_definition(
    payload: AssetCustomFieldDefinitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> AssetCustomFieldDefinitionRead:
    return AssetCustomFieldDefinitionService(db).create(payload)


@router.patch("/{definition_id}", response_model=AssetCustomFieldDefinitionRead)
def update_asset_custom_field_definition(
    definition_id: int,
    payload: AssetCustomFieldDefinitionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> AssetCustomFieldDefinitionRead:
    return AssetCustomFieldDefinitionService(db).update(definition_id, payload)


@router.delete("/{definition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset_custom_field_definition(
    definition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> None:
    AssetCustomFieldDefinitionService(db).delete(definition_id)
