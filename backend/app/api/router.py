from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin, get_current_user
from app.api.routes import (
    asset_history,
    asset_naming_rules,
    asset_statuses,
    asset_types,
    assets,
    audit_logs,
    auth,
    backups,
    dashboard,
    event_types,
    events,
    places,
    settings,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(dashboard.router, dependencies=[Depends(get_current_user)])
api_router.include_router(asset_types.router, dependencies=[Depends(get_current_user)])
api_router.include_router(asset_statuses.router, dependencies=[Depends(get_current_user)])
api_router.include_router(places.router, dependencies=[Depends(get_current_user)])
api_router.include_router(asset_naming_rules.router, dependencies=[Depends(get_current_user)])
api_router.include_router(event_types.router, dependencies=[Depends(get_current_user)])
api_router.include_router(assets.router, dependencies=[Depends(get_current_user)])
api_router.include_router(events.router, dependencies=[Depends(get_current_user)])
api_router.include_router(asset_history.router, dependencies=[Depends(get_current_user)])
api_router.include_router(audit_logs.router, dependencies=[Depends(get_current_admin)])
api_router.include_router(settings.router, dependencies=[Depends(get_current_user)])
api_router.include_router(users.router, dependencies=[Depends(get_current_admin)])
api_router.include_router(backups.router, dependencies=[Depends(get_current_admin)])
