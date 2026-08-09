from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

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


class AssetEventBulkCreate(BaseModel):
    event_type_id: int
    event_date: datetime
    description: str | None = None
    inventory_numbers: list[str] = Field(min_length=1)


class AssetEventBulkCreated(BaseModel):
    inventory_number: str
    asset_name: str
    event: AssetEventWithType


class AssetEventBulkError(BaseModel):
    inventory_number: str
    message: str


class AssetEventBulkResult(BaseModel):
    created: list[AssetEventBulkCreated]
    errors: list[AssetEventBulkError]
