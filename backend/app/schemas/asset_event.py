from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.asset_status import AssetStatusRead
from app.schemas.asset_type import AssetTypeRead
from app.schemas.event_type import EventTypeRead
from app.schemas.user import UserSummary


class AssetEventBase(BaseModel):
    event_type_id: int
    event_date: datetime
    description: str | None = None


class AssetEventCreate(AssetEventBase):
    pass


class AssetEventUpdate(BaseModel):
    event_type_id: int | None = None
    event_date: datetime | None = None
    description: str | None = None


class AssetEventRead(AssetEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    performed_by_user: UserSummary | None
    created_at: datetime


class AssetEventWithType(AssetEventRead):
    event_type: EventTypeRead


class AssetEventBulkTargets(BaseModel):
    asset_ids: list[int] = Field(default_factory=list)
    inventory_numbers: list[int] = Field(default_factory=list)

    @model_validator(mode="after")
    def _ensure_targets(self) -> "AssetEventBulkTargets":
        if not self.asset_ids and not self.inventory_numbers:
            raise ValueError("Specify at least one asset or inventory number")
        return self


class AssetEventBulkResolveRequest(AssetEventBulkTargets):
    pass


class AssetEventBulkApply(AssetEventBulkTargets):
    event_type_id: int
    event_date: datetime
    description: str | None = None


class AssetEventBulkCreated(BaseModel):
    asset_id: int
    asset_name: str
    inventory_number: int | None
    event: AssetEventWithType


class AssetEventBulkError(BaseModel):
    inventory_number: int
    message: str


class AssetEventBulkResult(BaseModel):
    created: list[AssetEventBulkCreated]
    errors: list[AssetEventBulkError]


class AssetEventBulkPreviewItem(BaseModel):
    asset_id: int
    asset_name: str
    asset_type: AssetTypeRead
    inventory_number: int | None
    status: AssetStatusRead


class AssetEventBulkPreviewResult(BaseModel):
    items: list[AssetEventBulkPreviewItem]
    not_found: list[int]
