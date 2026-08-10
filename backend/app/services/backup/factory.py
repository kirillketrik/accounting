from __future__ import annotations

from typing import Any

from app.core.exceptions import ConflictError
from app.services.backup.telegram_transport import TelegramBackupTransport
from app.services.backup.transport import BackupTransport
from app.services.backup.types import BackupSettingsType


def build_transport(type_: BackupSettingsType, credentials: dict[str, Any]) -> BackupTransport:
    if type_ == BackupSettingsType.telegram:
        return TelegramBackupTransport(credentials["bot_token"])
    raise ConflictError(f"Unsupported backup settings type: {type_}")
