from sqlalchemy.orm import Session

from app.repositories.asset import AssetRepository
from app.repositories.asset_event import AssetEventRepository
from app.schemas.dashboard import AssetsByStatus, DashboardSummary, LatestEvent


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.asset_repo = AssetRepository(db)
        self.event_repo = AssetEventRepository(db)

    def get_summary(self, latest_events_limit: int = 10) -> DashboardSummary:
        total_assets = self.asset_repo.total_count()
        by_status = [
            AssetsByStatus(status_id=status_id, status_name=status_name, count=count)
            for status_id, status_name, count in self.asset_repo.count_by_status()
        ]
        latest_events = [
            LatestEvent(
                id=event.id,
                asset_id=event.asset_id,
                asset_name=event.asset.name,
                event_type_name=event.event_type.name,
                event_date=event.event_date,
                performed_by_user=event.performed_by_user,
                created_at=event.created_at,
            )
            for event in self.event_repo.latest(limit=latest_events_limit)
        ]
        return DashboardSummary(
            total_assets=total_assets, assets_by_status=by_status, latest_events=latest_events
        )
