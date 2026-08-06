from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.app_settings import AppSettingsRead, AppSettingsUpdate
from app.services.app_settings_service import AppSettingsService

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=AppSettingsRead)
def get_settings_(db: Session = Depends(get_db)) -> AppSettingsRead:
    return AppSettingsService(db).get()


@router.put("", response_model=AppSettingsRead)
def update_settings(payload: AppSettingsUpdate, db: Session = Depends(get_db)) -> AppSettingsRead:
    return AppSettingsService(db).update(payload)
