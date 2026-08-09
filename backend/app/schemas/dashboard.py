from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserSummary


class AssetsByStatus(BaseModel):
    status_id: int
    status_name: str
    count: int


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
    assets_by_status: list[AssetsByStatus]
    latest_events: list[LatestEvent]
