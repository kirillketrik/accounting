from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.audit_log import AuditAction, AuditEntityType, AuditLogDetail, AuditLogRead
from app.schemas.common import PaginatedResponse
from app.services.audit_log_service import AuditLogService

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=PaginatedResponse[AuditLogRead])
def list_audit_logs(
    db: Session = Depends(get_db),
    entity_type: AuditEntityType | None = Query(default=None),
    action: AuditAction | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[AuditLogRead]:
    items, total = AuditLogService(db).list(
        entity_type=entity_type,
        action=action,
        search=search,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{audit_log_id}", response_model=AuditLogDetail)
def get_audit_log(audit_log_id: int, db: Session = Depends(get_db)) -> AuditLogDetail:
    return AuditLogService(db).get(audit_log_id)
