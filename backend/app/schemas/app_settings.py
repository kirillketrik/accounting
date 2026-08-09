from pydantic import BaseModel, ConfigDict, Field


class AppSettingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    default_asset_type_id: int | None
    default_bulk_asset_template: str | None
    default_bulk_asset_separator: str | None
    default_bulk_event_separator: str | None
    default_export_template: str | None
    default_export_separator: str | None


class AppSettingsUpdate(BaseModel):
    default_asset_type_id: int | None = None
    default_bulk_asset_template: str | None = Field(default=None, max_length=300)
    default_bulk_asset_separator: str | None = Field(default=None, max_length=10)
    default_bulk_event_separator: str | None = Field(default=None, max_length=10)
    default_export_template: str | None = Field(default=None, max_length=300)
    default_export_separator: str | None = Field(default=None, max_length=10)
