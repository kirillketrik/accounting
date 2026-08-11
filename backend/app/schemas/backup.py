from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.services.backup.types import BackupSettingsType


class BackupSettingsRead(BaseModel):
    id: int
    name: str
    type: BackupSettingsType
    enabled: bool
    interval_hours: int | None
    has_credentials: bool
    last_run_at: datetime | None
    updated_at: datetime


class BackupSettingsCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: BackupSettingsType
    enabled: bool = False
    interval_hours: int | None = Field(default=None, ge=1, le=168)
    # Opaque, transport-specific string produced by the frontend's type-specific
    # creation form (e.g. a bare bot token for Telegram). See
    # app.services.backup.credentials.CredentialCodec — the backend never
    # interprets its structure beyond decode()-validating it for `type`.
    credentials: str | None = Field(default=None, max_length=2000)


class BackupSettingsUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    enabled: bool | None = None
    interval_hours: int | None = Field(default=None, ge=1, le=168)
    credentials: str | None = Field(default=None, max_length=2000)


class BackupRecipientBase(BaseModel):
    # Opaque, transport-specific address (Telegram chat_id, email, etc.) — its
    # expected shape is determined by the parent BackupSettings' type.
    recipient_identifier: str = Field(min_length=1, max_length=2000)
    label: str | None = Field(default=None, max_length=100)


class BackupRecipientCreate(BackupRecipientBase):
    pass


class BackupRecipientUpdate(BaseModel):
    label: str | None = Field(default=None, max_length=100)
    is_active: bool | None = None


class BackupRecipientRead(BackupRecipientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    backup_settings_id: int
    is_active: bool
    created_at: datetime


class DeliveryResult(BaseModel):
    recipient_identifier: str
    success: bool
    error: str | None


class BackupRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    trigger: str
    status: str
    file_name: str | None
    file_size: int | None
    error_message: str | None
    delivery_details: list[DeliveryResult]
    triggered_by_user_id: int | None
    backup_settings_id: int | None
    created_at: datetime


class ImportResultRead(BaseModel):
    pre_backup_filename: str | None
