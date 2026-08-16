from datetime import datetime, timezone

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import hash_token
from app.db.session import get_db
from app.models.session import UserSession
from app.models.user import User

settings = get_settings()

__all__ = ["get_db", "get_current_user", "get_current_admin"]


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise UnauthorizedError()

    session = db.get(UserSession, hash_token(token))
    if session is None or session.expires_at < datetime.now(timezone.utc):
        raise UnauthorizedError()

    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        raise UnauthorizedError()

    return user


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise ForbiddenError()
    return current_user
