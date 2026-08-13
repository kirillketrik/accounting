from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserSummary


class AssetsByStatus(BaseModel):
    status_id: int
    status_name: str
    count: int


class AssetsByType(BaseModel):
    asset_type_id: int
    asset_type_name: str
    count: int


class EventsByType(BaseModel):
    event_type_id: int
    event_type_name: str
    count: int


class MonthlyActivityPoint(BaseModel):
    month: str
    new_assets: int
    events: int
    disposals: int


class LatestEvent(BaseModel):
    id: int
    asset_id: int
    asset_name: str
    event_type_name: str
    event_date: datetime
    performed_by_user: UserSummary | None
    created_at: datetime


class DashboardSummary(BaseModel):
    total_assets: int
    total_events: int
    total_disposals: int
    assets_by_status: list[AssetsByStatus]
    assets_by_type: list[AssetsByType]
    events_by_type: list[EventsByType]
    monthly_activity: list[MonthlyActivityPoint]
    latest_events: list[LatestEvent]
