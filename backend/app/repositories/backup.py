from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.backup import BackupRecipient, BackupRun, BackupSettings
from app.repositories.base import BaseRepository


class BackupSettingsRepository(BaseRepository[BackupSettings]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, BackupSettings)

    def list_enabled(self) -> list[BackupSettings]:
        return list(self.db.scalars(select(BackupSettings).where(BackupSettings.enabled.is_(True))))


class BackupRecipientRepository(BaseRepository[BackupRecipient]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, BackupRecipient)

    def get_by_identifier(
        self, backup_settings_id: int, recipient_identifier: str
    ) -> BackupRecipient | None:
        return self.db.scalar(
            select(BackupRecipient).where(
                BackupRecipient.backup_settings_id == backup_settings_id,
                BackupRecipient.recipient_identifier == recipient_identifier,
            )
        )

    def list_by_settings(self, backup_settings_id: int) -> list[BackupRecipient]:
        return list(
            self.db.scalars(
                select(BackupRecipient).where(BackupRecipient.backup_settings_id == backup_settings_id)
            )
        )

    def list_active_for_settings(self, backup_settings_id: int) -> list[BackupRecipient]:
        return list(
            self.db.scalars(
                select(BackupRecipient).where(
                    BackupRecipient.backup_settings_id == backup_settings_id,
                    BackupRecipient.is_active.is_(True),
                )
            )
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
