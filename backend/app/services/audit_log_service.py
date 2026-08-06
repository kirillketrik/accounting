from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.audit_log import AuditLog
from app.repositories.audit_log import AuditLogRepository
from app.schemas.audit_log import AuditAction, AuditEntityType


def jsonable(value: Any) -> Any:
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def snapshot(obj: Any, fields: list[str]) -> dict[str, Any]:
    return {field: jsonable(getattr(obj, field)) for field in fields}


def diff_fields(before: dict[str, Any], after: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Return only the fields whose value actually changed, as {field: {before, after}}."""
    changed: dict[str, dict[str, Any]] = {}
    for key, new_value in after.items():
        old_value = jsonable(before.get(key))
        new_value = jsonable(new_value)
        if old_value != new_value:
            changed[key] = {"before": old_value, "after": new_value}
    return changed


class AuditLogService:
    def __init__(self, db: Session) -> None:
        self.repo = AuditLogRepository(db)

    def record(
        self,
        *,
        entity_type: AuditEntityType,
        entity_id: int | None,
        entity_name: str,
        action: AuditAction,
        changes: dict[str, Any] | None = None,
    ) -> AuditLog:
        return self.repo.create(
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            action=action,
            changes=changes or {},
        )

    def list(
        self,
        *,
        entity_type: str | None = None,
        action: str | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[AuditLog], int]:
        return self.repo.search(
            entity_type=entity_type, action=action, search=search, page=page, page_size=page_size
        )

    def get(self, id_: int) -> AuditLog:
        obj = self.repo.get(id_)
        if obj is None:
            raise NotFoundError("AuditLog", id_)
        return obj
