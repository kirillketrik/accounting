from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.event_type import EventTypeCreate, EventTypeRead, EventTypeUpdate
from app.services.event_type_service import EventTypeService

router = APIRouter(prefix="/event-types", tags=["Event Types"])


@router.get("", response_model=list[EventTypeRead])
def list_event_types(db: Session = Depends(get_db)) -> list[EventTypeRead]:
    return EventTypeService(db).list()


@router.post("", response_model=EventTypeRead, status_code=status.HTTP_201_CREATED)
def create_event_type(payload: EventTypeCreate, db: Session = Depends(get_db)) -> EventTypeRead:
    return EventTypeService(db).create(payload)


@router.get("/{event_type_id}", response_model=EventTypeRead)
def get_event_type(event_type_id: int, db: Session = Depends(get_db)) -> EventTypeRead:
    return EventTypeService(db).get(event_type_id)


@router.put("/{event_type_id}", response_model=EventTypeRead)
def update_event_type(
    event_type_id: int, payload: EventTypeUpdate, db: Session = Depends(get_db)
) -> EventTypeRead:
    return EventTypeService(db).update(event_type_id, payload)


@router.delete("/{event_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_type(event_type_id: int, db: Session = Depends(get_db)) -> None:
    EventTypeService(db).delete(event_type_id)
