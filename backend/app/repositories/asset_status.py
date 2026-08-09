from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.asset_status import AssetStatus
from app.models.event_type import EventType
from app.repositories.base import BaseRepository


class AssetStatusRepository(BaseRepository[AssetStatus]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, AssetStatus)

    def get_by_name(self, name: str) -> AssetStatus | None:
        return self.db.scalar(select(AssetStatus).where(AssetStatus.name == name))

    def get_default(self) -> AssetStatus | None:
        return self.db.scalar(select(AssetStatus).where(AssetStatus.is_default.is_(True)))

    def clear_default(self, *, except_id: int | None = None) -> None:
        stmt = select(AssetStatus).where(AssetStatus.is_default.is_(True))
        if except_id is not None:
            stmt = stmt.where(AssetStatus.id != except_id)
        for status in self.db.scalars(stmt):
            status.is_default = False
        self.db.commit()

    def asset_count(self, status_id: int) -> int:
        return self.db.scalar(
            select(func.count()).select_from(Asset).where(Asset.status_id == status_id)
        )

    def event_type_count(self, status_id: int) -> int:
        return self.db.scalar(
            select(func.count())
            .select_from(EventType)
            .where(EventType.target_status_id == status_id)
        )
