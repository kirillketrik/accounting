from __future__ import annotations

from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings
from app.core.exceptions import ConflictError


@lru_cache
def _fernet() -> Fernet:
    key = get_settings().backup_credentials_key
    if not key:
        raise ConflictError(
            "BACKUP_CREDENTIALS_KEY is not configured; generate one with "
            "`python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"`"
        )
    return Fernet(key.encode("utf-8"))


def encrypt_secret(raw: str) -> str:
    return _fernet().encrypt(raw.encode("utf-8")).decode("utf-8")


def decrypt_secret(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ConflictError("Stored credentials could not be decrypted") from exc
