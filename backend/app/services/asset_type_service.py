from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.asset_type import AssetType
from app.repositories.asset_type import AssetTypeRepository
from app.schemas.asset_type import AssetTypeCreate, AssetTypeUpdate


class AssetTypeService:
    def __init__(self, db: Session) -> None:
        self.repo = AssetTypeRepository(db)

    def list(self) -> list[AssetType]:
        return self.repo.list()

    def get(self, id_: int) -> AssetType:
        obj = self.repo.get(id_)
        if obj is None:
            raise NotFoundError("AssetType", id_)
        return obj

    def create(self, data: AssetTypeCreate) -> AssetType:
        if self.repo.get_by_name(data.name) is not None:
            raise ConflictError(f"Asset type '{data.name}' already exists")
        return self.repo.create(**data.model_dump())

    def update(self, id_: int, data: AssetTypeUpdate) -> AssetType:
        obj = self.get(id_)
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload:
            existing = self.repo.get_by_name(payload["name"])
            if existing is not None and existing.id != id_:
                raise ConflictError(f"Asset type '{payload['name']}' already exists")
        return self.repo.update(obj, **payload)

    def delete(self, id_: int) -> None:
        obj = self.get(id_)
        if self.repo.asset_count(id_) > 0:
            raise ConflictError("Cannot delete an asset type that is still in use by assets")
        self.repo.delete(obj)
