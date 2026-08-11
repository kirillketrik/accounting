from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base
from app.services.backup.types import BackupSettingsType


class BackupSettings(Base):
    """A named backup destination config (e.g. "Prod Telegram").

    ``credentials`` holds the Fernet-encrypted raw string produced by the
    CredentialCodec for ``type`` (see app.services.backup.credentials) — the
    model itself never sees plaintext.
    """

    __tablename__ = "backup_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")
    interval_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    credentials: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    @property
    def type_enum(self) -> BackupSettingsType:
        return BackupSettingsType(self.type)


class BackupRecipient(Base):
    """An address (Telegram chat_id, email, etc.) that receives backup documents
    through a specific BackupSettings destination — the identifier's shape and
    meaning are transport-specific, so it only makes sense in that context.
    """

    __tablename__ = "backup_recipients"
    __table_args__ = (
        UniqueConstraint(
            "backup_settings_id", "recipient_identifier", name="uq_backup_recipients_settings_identifier"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    backup_settings_id: Mapped[int] = mapped_column(
        ForeignKey("backup_settings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recipient_identifier: Mapped[str] = mapped_column(Text, nullable=False)
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class BackupRun(Base):
    """History/audit trail of backup and import operations.

    No foreign key on triggered_by_user_id being required: scheduled runs have no
    triggering user, and an import replaces the whole database so the row logged
    right after an import lives in a fresh DB where the user still exists.
    """

    __tablename__ = "backup_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    trigger: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    delivery_details: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    triggered_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    backup_settings_id: Mapped[int | None] = mapped_column(
        ForeignKey("backup_settings.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
