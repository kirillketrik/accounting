from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.asset_status import AssetStatus
from app.repositories.asset_status import AssetStatusRepository
from app.schemas.asset_status import AssetStatusCreate, AssetStatusUpdate


class AssetStatusService:
    def __init__(self, db: Session) -> None:
        self.repo = AssetStatusRepository(db)

    def list(self) -> list[AssetStatus]:
        return self.repo.list()

    def get(self, id_: int) -> AssetStatus:
        obj = self.repo.get(id_)
        if obj is None:
            raise NotFoundError("AssetStatus", id_)
        return obj

    def create(self, data: AssetStatusCreate) -> AssetStatus:
        if self.repo.get_by_name(data.name) is not None:
            raise ConflictError(f"Asset status '{data.name}' already exists")
        obj = self.repo.create(**data.model_dump())
        if obj.is_default:
            self.repo.clear_default(except_id=obj.id)
        return obj

    def update(self, id_: int, data: AssetStatusUpdate) -> AssetStatus:
        obj = self.get(id_)
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload:
            existing = self.repo.get_by_name(payload["name"])
            if existing is not None and existing.id != id_:
                raise ConflictError(f"Asset status '{payload['name']}' already exists")
        updated = self.repo.update(obj, **payload)
        if payload.get("is_default"):
            self.repo.clear_default(except_id=id_)
        return updated

    def delete(self, id_: int) -> None:
        obj = self.get(id_)
        if self.repo.asset_count(id_) > 0:
            raise ConflictError("Cannot delete an asset status that is still in use by assets")
        if self.repo.event_type_count(id_) > 0:
            raise ConflictError(
                "Cannot delete an asset status that is still used as an event type's target status"
            )
        self.repo.delete(obj)
