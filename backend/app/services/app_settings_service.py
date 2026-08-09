from sqlalchemy.orm import Session

from app.models.app_settings import AppSettings
from app.repositories.app_settings import AppSettingsRepository
from app.schemas.app_settings import AppSettingsUpdate


class AppSettingsService:
    def __init__(self, db: Session) -> None:
        self.repo = AppSettingsRepository(db)

    def get(self, user_id: int) -> AppSettings:
        obj = self.repo.get_for_user(user_id)
        if obj is None:
            obj = AppSettings(user_id=user_id)
            self.repo.db.add(obj)
            self.repo.db.commit()
            self.repo.db.refresh(obj)
        return obj

    def update(self, user_id: int, data: AppSettingsUpdate) -> AppSettings:
        obj = self.get(user_id)
        return self.repo.update(obj, **data.model_dump())
