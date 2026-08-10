from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.backup import BackupRecipient, BackupRun, BackupSettings
from app.repositories.base import BaseRepository


class BackupSettingsRepository(BaseRepository[BackupSettings]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, BackupSettings)


class BackupRecipientRepository(BaseRepository[BackupRecipient]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, BackupRecipient)

    def get_by_chat_id(self, chat_id: str) -> BackupRecipient | None:
        return self.db.scalar(select(BackupRecipient).where(BackupRecipient.chat_id == chat_id))

    def list_active(self) -> list[BackupRecipient]:
        return list(
            self.db.scalars(select(BackupRecipient).where(BackupRecipient.is_active.is_(True)))
        )


class BackupRunRepository(BaseRepository[BackupRun]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, BackupRun)

    def search(self, *, page: int = 1, page_size: int = 20) -> tuple[list[BackupRun], int]:
        stmt = select(BackupRun)

        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

        stmt = (
            stmt.order_by(BackupRun.created_at.desc(), BackupRun.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list(self.db.scalars(stmt))
        return items, total
