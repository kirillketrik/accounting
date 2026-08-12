from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.asset_custom_field_definition import AssetCustomFieldDefinition
from app.repositories.base import BaseRepository


class AssetCustomFieldDefinitionRepository(BaseRepository[AssetCustomFieldDefinition]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, AssetCustomFieldDefinition)

    def list_by_asset_type(self, asset_type_id: int) -> list[AssetCustomFieldDefinition]:
        stmt = select(AssetCustomFieldDefinition).where(
            AssetCustomFieldDefinition.asset_type_id == asset_type_id
        )
        return list(self.db.scalars(stmt))

    def get_by_type_and_name(
        self, asset_type_id: int, name: str
    ) -> AssetCustomFieldDefinition | None:
        return self.db.scalar(
            select(AssetCustomFieldDefinition).where(
                AssetCustomFieldDefinition.asset_type_id == asset_type_id,
                AssetCustomFieldDefinition.name == name,
            )
        )
