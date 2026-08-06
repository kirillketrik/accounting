from fastapi import APIRouter

from app.api.routes import (
    asset_history,
    asset_naming_rules,
    asset_types,
    assets,
    audit_logs,
    dashboard,
    event_types,
    events,
    settings,
)

api_router = APIRouter()
api_router.include_router(dashboard.router)
api_router.include_router(asset_types.router)
api_router.include_router(asset_naming_rules.router)
api_router.include_router(event_types.router)
api_router.include_router(assets.router)
api_router.include_router(events.router)
api_router.include_router(asset_history.router)
api_router.include_router(audit_logs.router)
api_router.include_router(settings.router)
