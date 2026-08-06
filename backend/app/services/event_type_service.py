from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.event_type import EventType
from app.repositories.event_type import EventTypeRepository
from app.schemas.event_type import EventTypeCreate, EventTypeUpdate


class EventTypeService:
    def __init__(self, db: Session) -> None:
        self.repo = EventTypeRepository(db)

    def list(self) -> list[EventType]:
        return self.repo.list()

    def get(self, id_: int) -> EventType:
        obj = self.repo.get(id_)
        if obj is None:
            raise NotFoundError("EventType", id_)
        return obj

    def create(self, data: EventTypeCreate) -> EventType:
        if self.repo.get_by_name(data.name) is not None:
            raise ConflictError(f"Event type '{data.name}' already exists")
        return self.repo.create(**data.model_dump())

    def update(self, id_: int, data: EventTypeUpdate) -> EventType:
        obj = self.get(id_)
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload:
            existing = self.repo.get_by_name(payload["name"])
            if existing is not None and existing.id != id_:
                raise ConflictError(f"Event type '{payload['name']}' already exists")
        return self.repo.update(obj, **payload)

    def delete(self, id_: int) -> None:
        obj = self.get(id_)
        if self.repo.usage_count(id_) > 0:
            raise ConflictError("Cannot delete an event type that is still in use by events")
        self.repo.delete(obj)
