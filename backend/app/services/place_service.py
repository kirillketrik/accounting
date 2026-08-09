from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.place import Place
from app.repositories.place import PlaceRepository
from app.schemas.place import PlaceCreate, PlaceUpdate


class PlaceService:
    def __init__(self, db: Session) -> None:
        self.repo = PlaceRepository(db)

    def list(self) -> list[Place]:
        return self.repo.list()

    def get(self, id_: int) -> Place:
        obj = self.repo.get(id_)
        if obj is None:
            raise NotFoundError("Place", id_)
        return obj

    def create(self, data: PlaceCreate) -> Place:
        if self.repo.get_by_name(data.name) is not None:
            raise ConflictError(f"Place '{data.name}' already exists")
        return self.repo.create(**data.model_dump())

    def update(self, id_: int, data: PlaceUpdate) -> Place:
        obj = self.get(id_)
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload:
            existing = self.repo.get_by_name(payload["name"])
            if existing is not None and existing.id != id_:
                raise ConflictError(f"Place '{payload['name']}' already exists")
        return self.repo.update(obj, **payload)

    def delete(self, id_: int) -> None:
        obj = self.get(id_)
        if self.repo.asset_count(id_) > 0:
            raise ConflictError("Cannot delete a place that is still in use by assets")
        self.repo.delete(obj)
