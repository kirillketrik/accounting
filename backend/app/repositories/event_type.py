from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.asset_event import AssetEvent
from app.models.event_type import EventType
from app.repositories.base import BaseRepository


class EventTypeRepository(BaseRepository[EventType]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, EventType)

    def get_by_name(self, name: str) -> EventType | None:
        return self.db.scalar(select(EventType).where(EventType.name == name))

    def usage_count(self, event_type_id: int) -> int:
        return self.db.scalar(
            select(func.count()).select_from(AssetEvent).where(AssetEvent.event_type_id == event_type_id)
        )
