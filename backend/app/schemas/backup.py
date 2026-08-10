from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BackupSettingsRead(BaseModel):
    id: int
    enabled: bool
    interval_hours: int | None
    has_bot_token: bool
    last_run_at: datetime | None


class BackupSettingsUpdate(BaseModel):
    enabled: bool | None = None
    interval_hours: int | None = Field(default=None, ge=1, le=168)
    telegram_bot_token: str | None = Field(default=None, max_length=300)


class BackupRecipientBase(BaseModel):
    chat_id: str = Field(min_length=1, max_length=64)
    label: str | None = Field(default=None, max_length=100)


class BackupRecipientCreate(BackupRecipientBase):
    pass


class BackupRecipientUpdate(BaseModel):
    label: str | None = Field(default=None, max_length=100)
    is_active: bool | None = None


class BackupRecipientRead(BackupRecipientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime


class DeliveryResult(BaseModel):
    chat_id: str
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
    created_at: datetime


class ImportResultRead(BaseModel):
    pre_backup_filename: str | None
