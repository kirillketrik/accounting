from datetime import date
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

CustomFieldValue = str | float | bool | date | None


class CustomFieldType(StrEnum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    BOOLEAN = "boolean"


class AssetCustomFieldDefinitionBase(BaseModel):
    asset_type_id: int
    name: str = Field(min_length=1, max_length=255)
    field_type: CustomFieldType
    is_required: bool = False


class AssetCustomFieldDefinitionCreate(AssetCustomFieldDefinitionBase):
    pass


class AssetCustomFieldDefinitionUpdate(BaseModel):
    """``field_type`` is intentionally not editable: changing it after values have
    been stored as type-specific strings would strand them in an unparseable
    format. To change a field's type, delete and recreate the definition.
    """

    name: str | None = Field(default=None, min_length=1, max_length=255)
    is_required: bool | None = None


class AssetCustomFieldDefinitionRead(AssetCustomFieldDefinitionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class AssetCustomFieldValueInput(BaseModel):
    definition_id: int
    value: CustomFieldValue = None


class AssetCustomFieldValueRead(BaseModel):
    definition_id: int
    name: str
    field_type: CustomFieldType
    value: CustomFieldValue = None


class AssetCustomFieldHistoryEntry(BaseModel):
    """Denormalized snapshot copy for AssetHistory — value is always a JSON-safe
    primitive (see coerce_stored_value_json_safe), never a `date` object.
    """

    definition_id: int
    name: str
    field_type: CustomFieldType
    value: str | float | bool | None = None


def coerce_stored_value(raw: str | None, field_type: CustomFieldType) -> CustomFieldValue:
    """Turn the generically-stored string column back into its typed Python value."""
    if raw is None:
        return None
    if field_type == CustomFieldType.NUMBER:
        return float(raw)
    if field_type == CustomFieldType.BOOLEAN:
        return raw == "true"
    if field_type == CustomFieldType.DATE:
        return date.fromisoformat(raw)
    return raw


def coerce_stored_value_json_safe(
    raw: str | None, field_type: CustomFieldType
) -> str | float | bool | None:
    """Like coerce_stored_value, but returns a plain JSON primitive (dates as ISO
    strings) rather than a `date` object — for embedding directly into a JSON column
    via json.dumps (the AssetHistory disposal snapshot), which bypasses Pydantic's
    date-aware JSON serialization.
    """
    value = coerce_stored_value(raw, field_type)
    return value.isoformat() if isinstance(value, date) else value


def serialize_value_for_storage(value: CustomFieldValue, field_type: CustomFieldType) -> str | None:
    """Inverse of coerce_stored_value: turn a typed input value into the string stored
    in AssetCustomFieldValue.value.
    """
    if value is None or value == "":
        return None
    if field_type == CustomFieldType.NUMBER:
        return str(float(value))
    if field_type == CustomFieldType.BOOLEAN:
        return "true" if bool(value) else "false"
    if field_type == CustomFieldType.DATE:
        return value.isoformat() if isinstance(value, date) else date.fromisoformat(str(value)).isoformat()
    return str(value)
