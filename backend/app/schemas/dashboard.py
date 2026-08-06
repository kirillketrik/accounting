from datetime import datetime

from pydantic import BaseModel


class AssetsByStatus(BaseModel):
    status: str
    count: int


class LatestEvent(BaseModel):
    id: int
    asset_id: int
    asset_name: str
    event_type_name: str
    event_date: datetime
    performed_by: str | None
    created_at: datetime


class DashboardSummary(BaseModel):
    total_assets: int
    assets_by_status: list[AssetsByStatus]
    latest_events: list[LatestEvent]
