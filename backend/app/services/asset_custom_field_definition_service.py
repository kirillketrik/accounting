from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.asset_custom_field_definition import AssetCustomFieldDefinition
from app.repositories.asset_custom_field_definition import AssetCustomFieldDefinitionRepository
from app.repositories.asset_type import AssetTypeRepository
from app.schemas.asset_custom_field import (
    AssetCustomFieldDefinitionCreate,
    AssetCustomFieldDefinitionUpdate,
)


class AssetCustomFieldDefinitionService:
    def __init__(self, db: Session) -> None:
        self.repo = AssetCustomFieldDefinitionRepository(db)
        self.asset_type_repo = AssetTypeRepository(db)

    def list(self, asset_type_id: int | None = None) -> list[AssetCustomFieldDefinition]:
        if asset_type_id is not None:
            return self.repo.list_by_asset_type(asset_type_id)
        return self.repo.list()

    def get(self, id_: int) -> AssetCustomFieldDefinition:
        obj = self.repo.get(id_)
        if obj is None:
            raise NotFoundError("AssetCustomFieldDefinition", id_)
        return obj

    def _ensure_unique(
        self, asset_type_id: int, name: str, *, exclude_id: int | None = None
    ) -> None:
        existing = self.repo.get_by_type_and_name(asset_type_id, name)
        if existing is not None and existing.id != exclude_id:
            raise ConflictError(f"Custom field '{name}' already exists for this asset type")

    def create(self, data: AssetCustomFieldDefinitionCreate) -> AssetCustomFieldDefinition:
        if self.asset_type_repo.get(data.asset_type_id) is None:
            raise NotFoundError("AssetType", data.asset_type_id)
        self._ensure_unique(data.asset_type_id, data.name)
        return self.repo.create(
            asset_type_id=data.asset_type_id,
            name=data.name,
            field_type=data.field_type.value,
            is_required=data.is_required,
        )

    def update(
        self, id_: int, data: AssetCustomFieldDefinitionUpdate
    ) -> AssetCustomFieldDefinition:
        obj = self.get(id_)
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload:
            self._ensure_unique(obj.asset_type_id, payload["name"], exclude_id=id_)
        return self.repo.update(obj, **payload)

    def delete(self, id_: int) -> None:
        obj = self.get(id_)
        self.repo.delete(obj)
