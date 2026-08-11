from __future__ import annotations

from pathlib import Path
from typing import Any

import httpx

from app.services.backup.transport import BackupTransport

TELEGRAM_API_BASE = "https://api.telegram.org"


class TelegramBackupTransport(BackupTransport):
    """Sends the backup file as a document via the Telegram Bot API."""

    def __init__(self, bot_token: str) -> None:
        self.bot_token = bot_token

    def _redact(self, message: str) -> str:
        return message.replace(self.bot_token, "***") if self.bot_token else message

    def send(self, file_path: Path, filename: str, recipients: list[str]) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        url = f"{TELEGRAM_API_BASE}/bot{self.bot_token}/sendDocument"

        with httpx.Client(timeout=60) as client:
            for chat_id in recipients:
                try:
                    with file_path.open("rb") as f:
                        response = client.post(
                            url,
                            data={"chat_id": chat_id, "caption": filename},
                            files={"document": (filename, f, "application/octet-stream")},
                        )
                    body = response.json()
                    if not response.is_success or not body.get("ok"):
                        raise RuntimeError(body.get("description", f"HTTP {response.status_code}"))
                    results.append({"recipient_identifier": chat_id, "success": True, "error": None})
                except Exception as exc:
                    results.append(
                        {
                            "recipient_identifier": chat_id,
                            "success": False,
                            "error": self._redact(str(exc)),
                        }
                    )

        return results
