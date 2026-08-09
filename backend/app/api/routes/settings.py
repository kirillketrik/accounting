from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.app_settings import AppSettingsRead, AppSettingsUpdate
from app.services.app_settings_service import AppSettingsService

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=AppSettingsRead)
def get_settings_(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> AppSettingsRead:
    return AppSettingsService(db).get(current_user.id)


@router.put("", response_model=AppSettingsRead)
def update_settings(
    payload: AppSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppSettingsRead:
    return AppSettingsService(db).update(current_user.id, payload)
