from sqlalchemy.orm import Session

from app.models.app_settings import AppSettings
from app.repositories.app_settings import AppSettingsRepository
from app.schemas.app_settings import AppSettingsUpdate


class AppSettingsService:
    def __init__(self, db: Session) -> None:
        self.repo = AppSettingsRepository(db)

    def get(self) -> AppSettings:
        obj = self.repo.get_singleton()
        if obj is None:
            # Defensive fallback: the migration seeds row id=1, but cover the case
            # where the table was created without that seed row running.
            obj = AppSettings(id=1)
            self.repo.db.add(obj)
            self.repo.db.commit()
            self.repo.db.refresh(obj)
        return obj

    def update(self, data: AppSettingsUpdate) -> AppSettings:
        obj = self.get()
        return self.repo.update(obj, **data.model_dump())
