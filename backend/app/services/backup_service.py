from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import ConflictError, NotFoundError
from app.models.backup import BackupRecipient, BackupRun, BackupSettings
from app.models.user import User
from app.repositories.backup import (
    BackupRecipientRepository,
    BackupRunRepository,
    BackupSettingsRepository,
)
from app.schemas.backup import BackupRecipientCreate, BackupRecipientUpdate, BackupSettingsUpdate
from app.services.backup.telegram_transport import TelegramBackupTransport

SQLITE_HEADER = b"SQLite format 3\x00"
SQLITE_URL_PREFIX = "sqlite:///"


class ImportResult:
    def __init__(self, pre_backup_filename: str | None) -> None:
        self.pre_backup_filename = pre_backup_filename


class BackupService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings_repo = BackupSettingsRepository(db)
        self.recipient_repo = BackupRecipientRepository(db)
        self.run_repo = BackupRunRepository(db)

    # -- settings --------------------------------------------------------

    def get_settings(self) -> BackupSettings:
        obj = self.settings_repo.get(1)
        if obj is None:
            obj = BackupSettings(id=1, enabled=False)
            self.db.add(obj)
            self.db.commit()
            self.db.refresh(obj)
        return obj

    def update_settings(self, data: BackupSettingsUpdate) -> BackupSettings:
        obj = self.get_settings()
        payload = data.model_dump(exclude_unset=True)
        return self.settings_repo.update(obj, **payload)

    # -- recipients --------------------------------------------------------

    def list_recipients(self) -> list[BackupRecipient]:
        return self.recipient_repo.list()

    def create_recipient(self, data: BackupRecipientCreate) -> BackupRecipient:
        if self.recipient_repo.get_by_chat_id(data.chat_id) is not None:
            raise ConflictError(f"Recipient with chat_id '{data.chat_id}' already exists")
        return self.recipient_repo.create(**data.model_dump())

    def update_recipient(self, id_: int, data: BackupRecipientUpdate) -> BackupRecipient:
        obj = self.recipient_repo.get(id_)
        if obj is None:
            raise NotFoundError("BackupRecipient", id_)
        payload = data.model_dump(exclude_unset=True)
        return self.recipient_repo.update(obj, **payload)

    def delete_recipient(self, id_: int) -> None:
        obj = self.recipient_repo.get(id_)
        if obj is None:
            raise NotFoundError("BackupRecipient", id_)
        self.recipient_repo.delete(obj)

    # -- backup file creation --------------------------------------------------------

    def _sqlite_path(self) -> Path:
        database_url = get_settings().database_url
        if not database_url.startswith(SQLITE_URL_PREFIX):
            raise ConflictError("Automatic backup is only supported for SQLite databases")
        return Path(database_url[len(SQLITE_URL_PREFIX) :])

    def _backups_dir(self) -> Path:
        backups_dir = Path(get_settings().backups_dir)
        backups_dir.mkdir(parents=True, exist_ok=True)
        return backups_dir

    def create_backup_file(self) -> Path:
        """Snapshot the live SQLite DB using the online backup API (safe under concurrent writers)."""
        src_path = self._sqlite_path()
        backups_dir = self._backups_dir()
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        dest_path = backups_dir / f"backup_{timestamp}.db"

        src = sqlite3.connect(f"file:{src_path}?mode=ro", uri=True)
        try:
            dst = sqlite3.connect(str(dest_path))
            try:
                src.backup(dst)
            finally:
                dst.close()
        finally:
            src.close()

        self._enforce_retention(backups_dir)
        return dest_path

    def _enforce_retention(self, backups_dir: Path) -> None:
        retention = get_settings().backup_retention
        files = sorted(backups_dir.glob("backup_*.db"), key=lambda p: p.stat().st_mtime)
        for stale in files[:-retention] if retention > 0 else files:
            stale.unlink(missing_ok=True)

    # -- run execution --------------------------------------------------------

    def _perform_backup(self, run: BackupRun) -> BackupRun:
        try:
            file_path = self.create_backup_file()
        except Exception as exc:
            return self.run_repo.update(run, status="failed", error_message=str(exc))

        recipients = [r.chat_id for r in self.recipient_repo.list_active()]
        settings = self.get_settings()

        delivery_details: list[dict] = []
        status = "success"
        error_message = None

        if recipients:
            if settings.telegram_bot_token:
                transport = TelegramBackupTransport(settings.telegram_bot_token)
                delivery_details = transport.send(file_path, file_path.name, recipients)
                successes = [d for d in delivery_details if d["success"]]
                if not successes:
                    status = "failed"
                elif len(successes) < len(delivery_details):
                    status = "partial"
            else:
                status = "failed"
                error_message = "Telegram bot token is not configured"

        updated = self.run_repo.update(
            run,
            status=status,
            file_name=file_path.name,
            file_size=file_path.stat().st_size,
            error_message=error_message,
            delivery_details=delivery_details,
        )
        self.settings_repo.update(settings, last_run_at=datetime.utcnow())
        return updated

    def run_backup_sync(self, trigger: str, user: User | None) -> BackupRun:
        run = self.run_repo.create(
            trigger=trigger,
            status="pending",
            triggered_by_user_id=user.id if user else None,
        )
        return self._perform_backup(run)

    def trigger_backup_async(self, trigger: str, user: User | None) -> BackupRun:
        from app.services.backup.tasks import execute_backup_run

        run = self.run_repo.create(
            trigger=trigger,
            status="pending",
            triggered_by_user_id=user.id if user else None,
        )
        execute_backup_run.delay(run.id)
        return run

    def execute_pending_run(self, run_id: int) -> BackupRun:
        run = self.run_repo.get(run_id)
        if run is None:
            raise NotFoundError("BackupRun", run_id)
        return self._perform_backup(run)

    def run_scheduled_if_due(self) -> BackupRun | None:
        settings = self.get_settings()
        if not settings.enabled or not settings.interval_hours:
            return None
        due = settings.last_run_at is None or datetime.utcnow() - settings.last_run_at >= timedelta(
            hours=settings.interval_hours
        )
        if not due:
            return None
        return self.run_backup_sync(trigger="scheduled", user=None)

    # -- runs --------------------------------------------------------

    def list_runs(self, *, page: int = 1, page_size: int = 20) -> tuple[list[BackupRun], int]:
        return self.run_repo.search(page=page, page_size=page_size)

    def download_run(self, id_: int) -> Path:
        run = self.run_repo.get(id_)
        if run is None or run.file_name is None:
            raise NotFoundError("BackupRun", id_)
        file_path = self._backups_dir() / run.file_name
        if not file_path.exists():
            raise NotFoundError("BackupRun", id_)
        return file_path

    # -- import --------------------------------------------------------

    def _validate_sqlite_file(self, path: Path) -> None:
        with path.open("rb") as f:
            header = f.read(len(SQLITE_HEADER))
        if header != SQLITE_HEADER:
            raise ConflictError("Uploaded file is not a valid SQLite database")

        conn = sqlite3.connect(str(path))
        try:
            result = conn.execute("PRAGMA quick_check").fetchone()
            if result is None or result[0] != "ok":
                raise ConflictError("Uploaded database failed integrity check")
        finally:
            conn.close()

    def import_database(
        self, upload_path: Path, *, backup_before_import: bool, user: User
    ) -> ImportResult:
        import shutil

        from app.db.session import engine

        pre_backup_filename = None
        if backup_before_import:
            pre_run = self.run_backup_sync(trigger="pre_import", user=user)
            if pre_run.file_name is None:
                raise ConflictError(f"Pre-import backup failed, import aborted: {pre_run.error_message}")
            pre_backup_filename = pre_run.file_name

        self._validate_sqlite_file(upload_path)

        target_path = self._sqlite_path()
        engine.dispose()
        shutil.move(str(upload_path), str(target_path))

        # The DB file has just been replaced wholesale — anything written through this
        # process's engine/pool from here on would race with (or get orphaned by) other
        # processes' (celery-worker, celery-beat) still-open connections to the old file.
        # The caller is responsible for prompting a restart of the whole stack.
        return ImportResult(pre_backup_filename=pre_backup_filename)
