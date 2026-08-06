from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.asset_naming_rule import AssetNamingRule
from app.models.asset_type import AssetType
from app.repositories.base import BaseRepository


class AssetNamingRuleRepository(BaseRepository[AssetNamingRule]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, AssetNamingRule)

    def list_with_type(self) -> list[AssetNamingRule]:
        stmt = (
            select(AssetNamingRule)
            .options(joinedload(AssetNamingRule.asset_type))
            .join(AssetType)
            .order_by(AssetType.name.asc(), AssetNamingRule.serial_number.asc())
        )
        return list(self.db.scalars(stmt).unique())

    def get_with_type(self, id_: int) -> AssetNamingRule | None:
        return self.db.scalar(
            select(AssetNamingRule)
            .options(joinedload(AssetNamingRule.asset_type))
            .where(AssetNamingRule.id == id_)
        )

    def get_by_type_and_serial(
        self, asset_type_id: int, serial_number: str
    ) -> AssetNamingRule | None:
        return self.db.scalar(
            select(AssetNamingRule).where(
                AssetNamingRule.asset_type_id == asset_type_id,
                AssetNamingRule.serial_number == serial_number,
            )
        )

    def get_active_match(self, asset_type_id: int, serial_number: str) -> AssetNamingRule | None:
        return self.db.scalar(
            select(AssetNamingRule).where(
                AssetNamingRule.asset_type_id == asset_type_id,
                AssetNamingRule.serial_number == serial_number,
                AssetNamingRule.is_active.is_(True),
            )
        )
