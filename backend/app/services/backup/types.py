from __future__ import annotations

from enum import Enum


class BackupSettingsType(str, Enum):
    """Which transport a BackupSettings config delivers through.

    Drives both the frontend creation form (which credential fields to show)
    and, server-side, which CredentialCodec/BackupTransport implementation
    is selected for that config.
    """

    telegram = "telegram"
