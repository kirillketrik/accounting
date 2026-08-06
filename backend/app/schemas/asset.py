from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.asset import AssetStatus
from app.schemas.asset_type import AssetTypeRead


class AssetBase(BaseModel):
    asset_type_id: int
    name: str | None = Field(default=None, max_length=200)
    inventory_number: str | None = Field(default=None, max_length=100)
    serial_number: str | None = Field(default=None, max_length=100)
    status: AssetStatus = AssetStatus.IN_STORAGE
    location: str | None = Field(default=None, max_length=200)
    responsible_person: str | None = Field(default=None, max_length=200)
    notes: str | None = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    asset_type_id: int | None = None
    name: str | None = Field(default=None, max_length=200)
    inventory_number: str | None = Field(default=None, max_length=100)
    serial_number: str | None = Field(default=None, max_length=100)
    status: AssetStatus | None = None
    location: str | None = Field(default=None, max_length=200)
    responsible_person: str | None = Field(default=None, max_length=200)
    notes: str | None = None


class AssetRead(AssetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime
    updated_at: datetime


class AssetWithType(AssetRead):
    asset_type: AssetTypeRead


class AssetBulkItem(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    inventory_number: str | None = Field(default=None, max_length=100)
    serial_number: str | None = Field(default=None, max_length=100)


class AssetBulkCreate(BaseModel):
    asset_type_id: int
    responsible_person: str | None = Field(default=None, max_length=200)
    items: list[AssetBulkItem] = Field(min_length=1)


class AssetBulkError(BaseModel):
    index: int
    message: str


class AssetBulkResult(BaseModel):
    created: list[AssetWithType]
    errors: list[AssetBulkError]


class AssetBulkDeleteRequest(BaseModel):
    ids: list[int] = Field(min_length=1)


class AssetBulkDeleteError(BaseModel):
    id: int
    message: str


class AssetBulkDeleteResult(BaseModel):
    deleted_ids: list[int]
    errors: list[AssetBulkDeleteError]
