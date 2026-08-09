from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.app_settings import AppSettings
from app.repositories.base import BaseRepository


class AppSettingsRepository(BaseRepository[AppSettings]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, AppSettings)

    def get_for_user(self, user_id: int) -> AppSettings | None:
        return self.db.scalar(select(AppSettings).where(AppSettings.user_id == user_id))
