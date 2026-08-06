from sqlalchemy.orm import Session

from app.models.app_settings import AppSettings
from app.repositories.base import BaseRepository


class AppSettingsRepository(BaseRepository[AppSettings]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, AppSettings)

    def get_singleton(self) -> AppSettings | None:
        return self.db.get(AppSettings, 1)
