from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any


class BackupTransport(ABC):
    """A destination that a backup file can be delivered to.

    Telegram is the first implementation; other transports (e.g. email, S3)
    can be added later behind this same interface.
    """

    @abstractmethod
    def send(self, file_path: Path, filename: str, recipients: list[str]) -> list[dict[str, Any]]:
        """Deliver the backup file to each recipient.

        Returns one result per recipient, shaped as
        {"chat_id": str, "success": bool, "error": str | None}, so it can be
        stored directly as BackupRun.delivery_details.
        """
