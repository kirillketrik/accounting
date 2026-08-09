from app.schemas.asset import AssetCreate, AssetRead, AssetUpdate, AssetWithType
from app.schemas.asset_event import AssetEventCreate, AssetEventRead, AssetEventUpdate, AssetEventWithType
from app.schemas.asset_history import AssetHistoryEvent, AssetHistoryRead
from app.schemas.asset_status import AssetStatusCreate, AssetStatusRead, AssetStatusUpdate
from app.schemas.asset_type import AssetTypeCreate, AssetTypeRead, AssetTypeUpdate
from app.schemas.audit_log import AuditLogDetail, AuditLogRead
from app.schemas.common import PaginatedResponse
from app.schemas.dashboard import AssetsByStatus, DashboardSummary, LatestEvent
from app.schemas.event_counter import EventCounter
from app.schemas.event_type import EventTypeCreate, EventTypeRead, EventTypeUpdate
from app.schemas.place import PlaceCreate, PlaceRead, PlaceUpdate
from app.schemas.user import (
    ChangePasswordRequest,
    LoginRequest,
    PasswordResetRequest,
    UserCreate,
    UserProfileUpdate,
    UserRead,
    UserSummary,
    UserUpdate,
)

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
    "AssetStatusCreate",
    "AssetStatusRead",
    "AssetStatusUpdate",
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
    "PlaceCreate",
    "PlaceRead",
    "PlaceUpdate",
    "DashboardSummary",
    "AssetsByStatus",
    "LatestEvent",
    "ChangePasswordRequest",
    "LoginRequest",
    "PasswordResetRequest",
    "UserCreate",
    "UserProfileUpdate",
    "UserRead",
    "UserSummary",
    "UserUpdate",
]
