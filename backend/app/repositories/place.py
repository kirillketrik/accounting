from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.place import Place
from app.repositories.base import BaseRepository


class PlaceRepository(BaseRepository[Place]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Place)

    def get_by_name(self, name: str) -> Place | None:
        return self.db.scalar(select(Place).where(Place.name == name))

    def asset_count(self, place_id: int) -> int:
        return self.db.scalar(
            select(func.count()).select_from(Asset).where(Asset.place_id == place_id)
        )
