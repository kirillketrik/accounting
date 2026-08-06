from app.schemas.asset import AssetCreate, AssetRead, AssetUpdate, AssetWithType
from app.schemas.asset_event import AssetEventCreate, AssetEventRead, AssetEventUpdate, AssetEventWithType
from app.schemas.asset_history import AssetHistoryEvent, AssetHistoryRead
from app.schemas.asset_type import AssetTypeCreate, AssetTypeRead, AssetTypeUpdate
from app.schemas.audit_log import AuditLogDetail, AuditLogRead
from app.schemas.common import PaginatedResponse
from app.schemas.dashboard import AssetsByStatus, DashboardSummary, LatestEvent
from app.schemas.event_counter import EventCounter
from app.schemas.event_type import EventTypeCreate, EventTypeRead, EventTypeUpdate

__all__ = [
    "AssetCreate",
    "AssetRead",
    "AssetUpdate",
    "AssetWithType",
    "AssetEventCreate",
    "AssetEventRead",
    "AssetEventUpdate",
    "AssetEventWithType",
    "AssetHistoryEvent",
    "AssetHistoryRead",
    "AssetTypeCreate",
    "AssetTypeRead",
    "AssetTypeUpdate",
    "AuditLogDetail",
    "AuditLogRead",
    "EventCounter",
    "EventTypeCreate",
    "EventTypeRead",
    "EventTypeUpdate",
    "PaginatedResponse",
    "DashboardSummary",
    "AssetsByStatus",
    "LatestEvent",
]
