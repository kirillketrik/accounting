from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.asset_type import AssetTypeRead


class AssetNamingRuleBase(BaseModel):
    asset_type_id: int
    serial_number: str = Field(min_length=1, max_length=100)
    name_result: str = Field(min_length=1, max_length=200)
    is_active: bool = True


class AssetNamingRuleCreate(AssetNamingRuleBase):
    pass


class AssetNamingRuleUpdate(BaseModel):
    asset_type_id: int | None = None
    serial_number: str | None = Field(default=None, min_length=1, max_length=100)
    name_result: str | None = Field(default=None, min_length=1, max_length=200)
    is_active: bool | None = None


class AssetNamingRuleRead(AssetNamingRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class AssetNamingRuleWithType(AssetNamingRuleRead):
    asset_type: AssetTypeRead
