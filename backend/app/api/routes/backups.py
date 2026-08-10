import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, Form, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.core.config import get_settings
from app.models.backup import BackupSettings
from app.models.user import User
from app.schemas.backup import (
    BackupRecipientCreate,
    BackupRecipientRead,
    BackupRecipientUpdate,
    BackupRunRead,
    BackupSettingsCreate,
    BackupSettingsRead,
    BackupSettingsUpdate,
    ImportResultRead,
)
from app.schemas.common import PaginatedResponse
from app.services.backup_service import BackupService

router = APIRouter(prefix="/backups", tags=["Backups"])


def _settings_to_read(settings: BackupSettings) -> BackupSettingsRead:
    return BackupSettingsRead(
        id=settings.id,
        name=settings.name,
        type=settings.type_enum,
        enabled=settings.enabled,
        interval_hours=settings.interval_hours,
        has_credentials=bool(settings.credentials),
        last_run_at=settings.last_run_at,
        updated_at=settings.updated_at,
    )


@router.get("/settings", response_model=list[BackupSettingsRead])
def list_backup_settings(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)
) -> list[BackupSettingsRead]:
    return [_settings_to_read(s) for s in BackupService(db).list_settings()]


@router.post("/settings", response_model=BackupSettingsRead, status_code=status.HTTP_201_CREATED)
def create_backup_settings(
    payload: BackupSettingsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> BackupSettingsRead:
    return _settings_to_read(BackupService(db).create_settings(payload))


@router.patch("/settings/{settings_id}", response_model=BackupSettingsRead)
def update_backup_settings(
    settings_id: int,
    payload: BackupSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> BackupSettingsRead:
    return _settings_to_read(BackupService(db).update_settings(settings_id, payload))


@router.delete("/settings/{settings_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_backup_settings(
    settings_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> None:
    BackupService(db).delete_settings(settings_id)


@router.get("/recipients", response_model=list[BackupRecipientRead])
def list_recipients(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)
) -> list[BackupRecipientRead]:
    return BackupService(db).list_recipients()


@router.post(
    "/recipients", response_model=BackupRecipientRead, status_code=status.HTTP_201_CREATED
)
def create_recipient(
    payload: BackupRecipientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> BackupRecipientRead:
    return BackupService(db).create_recipient(payload)


@router.patch("/recipients/{recipient_id}", response_model=BackupRecipientRead)
def update_recipient(
    recipient_id: int,
    payload: BackupRecipientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> BackupRecipientRead:
    return BackupService(db).update_recipient(recipient_id, payload)


@router.delete("/recipients/{recipient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipient(
    recipient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> None:
    BackupService(db).delete_recipient(recipient_id)


@router.get("/runs", response_model=PaginatedResponse[BackupRunRead])
def list_runs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[BackupRunRead]:
    items, total = BackupService(db).list_runs(page=page, page_size=page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/settings/{settings_id}/run", response_model=BackupRunRead, status_code=status.HTTP_202_ACCEPTED
)
def run_backup_now(
    settings_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> BackupRunRead:
    service = BackupService(db)
    settings = service.get_settings(settings_id)
    return service.trigger_backup_async(trigger="manual", user=current_user, settings=settings)


@router.get("/runs/{run_id}/download")
def download_run(
    run_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)
) -> FileResponse:
    file_path = BackupService(db).download_run(run_id)
    return FileResponse(file_path, filename=file_path.name, media_type="application/octet-stream")


@router.post("/import", response_model=ImportResultRead)
def import_database(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
    backup_before_import: bool = Form(True),
) -> ImportResultRead:
    app_settings = get_settings()
    tmp_dir = Path(app_settings.backups_dir) / "tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    tmp_path = tmp_dir / f"import_{uuid4().hex}.db"
    with tmp_path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        result = BackupService(db).import_database(
            tmp_path, backup_before_import=backup_before_import, user=current_user
        )
    finally:
        tmp_path.unlink(missing_ok=True)

    return ImportResultRead(pre_backup_filename=result.pre_backup_filename)
