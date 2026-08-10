from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.core.exceptions import ConflictError
from app.services.backup.types import BackupSettingsType


class CredentialCodec(ABC):
    """Translates between the structured credential fields a transport needs
    and the single raw string that ``BackupSettings.credentials`` stores (encrypted).

    The frontend's creation form is type-specific (e.g. a bare bot token for
    Telegram, a protocol/host/password combo for a future email transport),
    but the API and storage layer only ever deal with one opaque raw string per
    config — ``decode`` is what turns that back into the fields a BackupTransport
    implementation actually needs at send time.
    """

    @abstractmethod
    def encode(self, fields: dict[str, Any]) -> str:
        """Pack structured input fields into the raw string that gets stored (encrypted)."""

    @abstractmethod
    def decode(self, raw: str) -> dict[str, Any]:
        """Unpack a stored raw string back into the fields a transport needs."""


class TelegramCredentialCodec(CredentialCodec):
    """Telegram only needs a bot token, so the raw string *is* the token."""

    def encode(self, fields: dict[str, Any]) -> str:
        token = fields.get("bot_token")
        if not token:
            raise ConflictError("bot_token is required for telegram backup settings")
        return str(token)

    def decode(self, raw: str) -> dict[str, Any]:
        return {"bot_token": raw}


_CODECS: dict[BackupSettingsType, CredentialCodec] = {
    BackupSettingsType.telegram: TelegramCredentialCodec(),
}


def get_credential_codec(type_: BackupSettingsType) -> CredentialCodec:
    try:
        return _CODECS[type_]
    except KeyError:
        raise ConflictError(f"Unsupported backup settings type: {type_}") from None
