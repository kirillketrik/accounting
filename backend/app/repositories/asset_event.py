from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.asset_event import AssetEvent
from app.models.event_type import EventType
from app.repositories.base import BaseRepository


class AssetEventRepository(BaseRepository[AssetEvent]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, AssetEvent)

    def counts_for_asset(self, asset_id: int) -> list[tuple[EventType, int]]:
        stmt = (
            select(EventType, func.count(AssetEvent.id))
            .join(AssetEvent, AssetEvent.event_type_id == EventType.id)
            .where(AssetEvent.asset_id == asset_id)
            .group_by(EventType.id)
        )
        return list(self.db.execute(stmt).all())

    def count_by_type(self) -> list[tuple[int, str, int]]:
        stmt = (
            select(EventType.id, EventType.name, func.count(AssetEvent.id))
            .select_from(AssetEvent)
            .join(EventType, AssetEvent.event_type_id == EventType.id)
            .group_by(EventType.id, EventType.name)
        )
        return list(self.db.execute(stmt).all())

    def event_dates_since(self, since: datetime) -> list[datetime]:
        stmt = select(AssetEvent.event_date).where(AssetEvent.event_date >= since)
        return list(self.db.scalars(stmt))

    def total_count(self) -> int:
        return self.db.scalar(select(func.count()).select_from(AssetEvent)) or 0

    def list_for_asset(self, asset_id: int) -> list[AssetEvent]:
        stmt = (
            select(AssetEvent)
            .options(joinedload(AssetEvent.event_type))
            .where(AssetEvent.asset_id == asset_id)
            .order_by(AssetEvent.event_date.desc(), AssetEvent.id.desc())
        )
        return list(self.db.scalars(stmt))

    def latest(self, limit: int = 10) -> list[AssetEvent]:
        stmt = (
            select(AssetEvent)
            .options(joinedload(AssetEvent.event_type), joinedload(AssetEvent.asset))
            .order_by(AssetEvent.event_date.desc(), AssetEvent.id.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt))
