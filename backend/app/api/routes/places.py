from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.place import PlaceCreate, PlaceRead, PlaceUpdate
from app.services.place_service import PlaceService

router = APIRouter(prefix="/places", tags=["Places"])


@router.get("", response_model=list[PlaceRead])
def list_places(db: Session = Depends(get_db)) -> list[PlaceRead]:
    return PlaceService(db).list()


@router.post("", response_model=PlaceRead, status_code=status.HTTP_201_CREATED)
def create_place(payload: PlaceCreate, db: Session = Depends(get_db)) -> PlaceRead:
    return PlaceService(db).create(payload)


@router.get("/{place_id}", response_model=PlaceRead)
def get_place(place_id: int, db: Session = Depends(get_db)) -> PlaceRead:
    return PlaceService(db).get(place_id)


@router.put("/{place_id}", response_model=PlaceRead)
def update_place(place_id: int, payload: PlaceUpdate, db: Session = Depends(get_db)) -> PlaceRead:
    return PlaceService(db).update(place_id, payload)


@router.delete("/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_place(place_id: int, db: Session = Depends(get_db)) -> None:
    PlaceService(db).delete(place_id)
