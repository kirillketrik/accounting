from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.asset_naming_rule import (
    AssetNamingRuleCreate,
    AssetNamingRuleUpdate,
    AssetNamingRuleWithType,
)
from app.services.asset_naming_rule_service import AssetNamingRuleService

router = APIRouter(prefix="/asset-naming-rules", tags=["Asset Naming Rules"])


@router.get("", response_model=list[AssetNamingRuleWithType])
def list_asset_naming_rules(db: Session = Depends(get_db)) -> list[AssetNamingRuleWithType]:
    return AssetNamingRuleService(db).list()


@router.post("", response_model=AssetNamingRuleWithType, status_code=status.HTTP_201_CREATED)
def create_asset_naming_rule(
    payload: AssetNamingRuleCreate, db: Session = Depends(get_db)
) -> AssetNamingRuleWithType:
    return AssetNamingRuleService(db).create(payload)


@router.get("/{rule_id}", response_model=AssetNamingRuleWithType)
def get_asset_naming_rule(rule_id: int, db: Session = Depends(get_db)) -> AssetNamingRuleWithType:
    return AssetNamingRuleService(db).get(rule_id)


@router.put("/{rule_id}", response_model=AssetNamingRuleWithType)
def update_asset_naming_rule(
    rule_id: int, payload: AssetNamingRuleUpdate, db: Session = Depends(get_db)
) -> AssetNamingRuleWithType:
    return AssetNamingRuleService(db).update(rule_id, payload)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset_naming_rule(rule_id: int, db: Session = Depends(get_db)) -> None:
    AssetNamingRuleService(db).delete(rule_id)
