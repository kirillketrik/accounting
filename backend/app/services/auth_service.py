from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedError
from app.core.security import generate_session_token, hash_password, hash_token, verify_password
from app.models.session import UserSession
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import ChangePasswordRequest, LoginRequest


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.user_repo = UserRepository(db)
        self.settings = get_settings()

    def login(self, data: LoginRequest) -> tuple[User, str, datetime]:
        user = self.user_repo.get_by_username(data.username)
        if (
            user is None
            or not user.is_active
            or not verify_password(data.password, user.password_hash)
        ):
            raise UnauthorizedError("Invalid username or password")

        token = generate_session_token()
        expires_at = datetime.utcnow() + timedelta(days=self.settings.session_ttl_days)
        session = UserSession(token_hash=hash_token(token), user_id=user.id, expires_at=expires_at)
        self.db.add(session)
        self.db.commit()
        return user, token, expires_at

    def logout(self, token: str) -> None:
        session = self.db.get(UserSession, hash_token(token))
        if session is not None:
            self.db.delete(session)
            self.db.commit()

    def change_password(self, user: User, data: ChangePasswordRequest) -> None:
        if not verify_password(data.current_password, user.password_hash):
            raise UnauthorizedError("Current password is incorrect")
        user.password_hash = hash_password(data.new_password)
        self.db.add(user)
        self.db.commit()
