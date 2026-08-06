from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.asset_history import AssetHistory
from app.repositories.asset_history import AssetHistoryRepository


class AssetHistoryService:
    def __init__(self, db: Session) -> None:
        self.repo = AssetHistoryRepository(db)

    def list(self, *, page: int = 1, page_size: int = 20) -> tuple[list[AssetHistory], int]:
        return self.repo.search(page=page, page_size=page_size)

    def get(self, id_: int) -> AssetHistory:
        obj = self.repo.get(id_)
        if obj is None:
            raise NotFoundError("AssetHistory", id_)
        return obj
