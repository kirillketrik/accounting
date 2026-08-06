from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.asset_history import AssetHistory
from app.repositories.base import BaseRepository


class AssetHistoryRepository(BaseRepository[AssetHistory]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, AssetHistory)

    def search(self, *, page: int = 1, page_size: int = 20) -> tuple[list[AssetHistory], int]:
        total = self.db.scalar(select(func.count()).select_from(AssetHistory)) or 0
        stmt = (
            select(AssetHistory)
            .order_by(AssetHistory.disposed_at.desc(), AssetHistory.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list(self.db.scalars(stmt))
        return items, total
