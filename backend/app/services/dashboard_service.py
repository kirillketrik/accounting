from collections import Counter
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.repositories.asset import AssetRepository
from app.repositories.asset_event import AssetEventRepository
from app.repositories.asset_history import AssetHistoryRepository
from app.schemas.dashboard import (
    AssetsByStatus,
    AssetsByType,
    DashboardSummary,
    EventsByType,
    LatestEvent,
    MonthlyActivityPoint,
)

MONTHLY_ACTIVITY_WINDOW = 12


def _month_key(moment: datetime) -> str:
    return f"{moment.year:04d}-{moment.month:02d}"


def _shift_months(year: int, month: int, offset: int) -> tuple[int, int]:
    zero_based = (year * 12 + (month - 1)) + offset
    return zero_based // 12, zero_based % 12 + 1


def _month_keys_window(now: datetime, months: int) -> list[str]:
    year, month = _shift_months(now.year, now.month, -(months - 1))
    keys = []
    for offset in range(months):
        y, m = _shift_months(year, month, offset)
        keys.append(f"{y:04d}-{m:02d}")
    return keys


def _window_start(now: datetime, months: int) -> datetime:
    year, month = _shift_months(now.year, now.month, -(months - 1))
    return datetime(year, month, 1, tzinfo=timezone.utc)


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.asset_repo = AssetRepository(db)
        self.event_repo = AssetEventRepository(db)
        self.history_repo = AssetHistoryRepository(db)

    def get_summary(self, latest_events_limit: int = 10) -> DashboardSummary:
        total_assets = self.asset_repo.total_count()
        total_events = self.event_repo.total_count()
        total_disposals = self.history_repo.total_count()

        by_status = [
            AssetsByStatus(status_id=status_id, status_name=status_name, count=count)
            for status_id, status_name, count in self.asset_repo.count_by_status()
        ]
        by_type = [
            AssetsByType(asset_type_id=type_id, asset_type_name=type_name, count=count)
            for type_id, type_name, count in self.asset_repo.count_by_type()
        ]
        events_by_type = [
            EventsByType(event_type_id=type_id, event_type_name=type_name, count=count)
            for type_id, type_name, count in self.event_repo.count_by_type()
        ]

        monthly_activity = self._get_monthly_activity()

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
            total_assets=total_assets,
            total_events=total_events,
            total_disposals=total_disposals,
            assets_by_status=by_status,
            assets_by_type=by_type,
            events_by_type=events_by_type,
            monthly_activity=monthly_activity,
            latest_events=latest_events,
        )

    def _get_monthly_activity(self) -> list[MonthlyActivityPoint]:
        now = datetime.now(timezone.utc)
        since = _window_start(now, MONTHLY_ACTIVITY_WINDOW)

        new_assets = Counter(
            _month_key(d) for d in self.asset_repo.created_dates_since(since)
        )
        events = Counter(_month_key(d) for d in self.event_repo.event_dates_since(since))
        disposals = Counter(
            _month_key(d) for d in self.history_repo.disposed_dates_since(since)
        )

        return [
            MonthlyActivityPoint(
                month=month,
                new_assets=new_assets.get(month, 0),
                events=events.get(month, 0),
                disposals=disposals.get(month, 0),
            )
            for month in _month_keys_window(now, MONTHLY_ACTIVITY_WINDOW)
        ]
