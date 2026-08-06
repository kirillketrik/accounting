from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

AuditEntityType = Literal["asset", "asset_event"]
AuditAction = Literal["create", "update", "delete", "bulk_create", "bulk_delete", "archive"]


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entity_type: AuditEntityType
    entity_id: int | None
    entity_name: str
    action: AuditAction
    created_at: datetime


class AuditLogDetail(AuditLogRead):
    changes: dict[str, Any]
