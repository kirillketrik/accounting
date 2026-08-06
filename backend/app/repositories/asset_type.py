from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.asset_type import AssetType
from app.repositories.base import BaseRepository


class AssetTypeRepository(BaseRepository[AssetType]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, AssetType)

    def get_by_name(self, name: str) -> AssetType | None:
        return self.db.scalar(select(AssetType).where(AssetType.name == name))

    def asset_count(self, asset_type_id: int) -> int:
        return self.db.scalar(
            select(func.count()).select_from(Asset).where(Asset.asset_type_id == asset_type_id)
        )
