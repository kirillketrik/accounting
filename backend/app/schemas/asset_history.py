from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AssetHistoryEvent(BaseModel):
    event_type_name: str
    event_date: datetime
    description: str | None = None
    performed_by: str | None = None
    created_at: datetime


class AssetHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_name: str
    asset_type_name: str
    inventory_number: str | None
    serial_number: str | None
    place_name: str | None
    responsible_person: str | None
    notes: str | None
    asset_created_at: datetime
    disposed_at: datetime
    events: list[AssetHistoryEvent]
    created_at: datetime
