from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.asset_custom_field import (
    AssetCustomFieldValueInput,
    AssetCustomFieldValueRead,
    CustomFieldType,
    coerce_stored_value,
)
from app.schemas.asset_status import AssetStatusRead
from app.schemas.asset_type import AssetTypeRead
from app.schemas.place import PlaceRead
from app.schemas.user import UserSummary


class AssetBase(BaseModel):
    asset_type_id: int
    name: str | None = Field(default=None, max_length=200)
    inventory_number: int | None = Field(default=None, ge=0)
    serial_number: str | None = Field(default=None, max_length=100)
    status_id: int | None = None
    place_id: int | None = None
    notes: str | None = None


class AssetCreate(AssetBase):
    custom_field_values: list[AssetCustomFieldValueInput] = Field(default_factory=list)


class AssetUpdate(BaseModel):
    asset_type_id: int | None = None
    name: str | None = Field(default=None, max_length=200)
    inventory_number: int | None = Field(default=None, ge=0)
    serial_number: str | None = Field(default=None, max_length=100)
    status_id: int | None = None
    place_id: int | None = None
    notes: str | None = None
    custom_field_values: list[AssetCustomFieldValueInput] | None = None


class AssetRead(AssetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    status_id: int
    status: AssetStatusRead
    place: PlaceRead | None
    responsible_user: UserSummary | None
    custom_field_values: list[AssetCustomFieldValueRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    @field_validator("custom_field_values", mode="before")
    @classmethod
    def _shape_custom_field_values(cls, value: Any) -> list[dict[str, Any]]:
        """Adapts the raw AssetCustomFieldValue ORM rows (asset.custom_field_values)
        into the AssetCustomFieldValueRead shape: those rows only carry definition_id
        and a raw stored string, not the definition's name/field_type or a typed value.
        """
        if not value:
            return []
        shaped = []
        for item in value:
            if isinstance(item, dict):
                shaped.append(item)
                continue
            field_type = CustomFieldType(item.definition.field_type)
            shaped.append(
                {
                    "definition_id": item.definition_id,
                    "name": item.definition.name,
                    "field_type": field_type,
                    "value": coerce_stored_value(item.value, field_type),
                }
            )
        return shaped


class AssetWithType(AssetRead):
    asset_type: AssetTypeRead


class AssetBulkItem(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    inventory_number: int | None = Field(default=None, ge=0)
    serial_number: str | None = Field(default=None, max_length=100)


class AssetBulkCreate(BaseModel):
    asset_type_id: int
    items: list[AssetBulkItem] = Field(min_length=1)


class AssetBulkError(BaseModel):
    index: int
    message: str


class AssetBulkResult(BaseModel):
    created: list[AssetWithType]
    errors: list[AssetBulkError]


class AssetBulkPreviewItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    index: int
    name: str
    inventory_number: int | None
    serial_number: str | None
    asset_type: AssetTypeRead
    status: AssetStatusRead
    responsible_user: UserSummary | None
    error: str | None = None


class AssetBulkPreviewResult(BaseModel):
    items: list[AssetBulkPreviewItem]


class AssetBulkDeleteRequest(BaseModel):
    ids: list[int] = Field(min_length=1)


class AssetBulkDeleteError(BaseModel):
    id: int
    message: str


class AssetBulkDeleteResult(BaseModel):
    deleted_ids: list[int]
    errors: list[AssetBulkDeleteError]
