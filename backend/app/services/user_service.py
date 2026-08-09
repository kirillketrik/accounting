from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.core.security import hash_password
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import PasswordResetRequest, UserCreate, UserProfileUpdate, UserUpdate


class UserService:
    def __init__(self, db: Session) -> None:
        self.repo = UserRepository(db)

    def list(self) -> list[User]:
        return self.repo.list()

    def get(self, id_: int) -> User:
        obj = self.repo.get(id_)
        if obj is None:
            raise NotFoundError("User", id_)
        return obj

    def _ensure_username_available(self, username: str, exclude_id: int | None = None) -> None:
        existing = self.repo.get_by_username(username)
        if existing is not None and existing.id != exclude_id:
            raise ConflictError(f"Username '{username}' already in use")

    def create(self, data: UserCreate) -> User:
        self._ensure_username_available(data.username)
        return self.repo.create(
            username=data.username,
            password_hash=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            is_admin=data.is_admin,
        )

    def update(self, id_: int, data: UserUpdate, current_user: User) -> User:
        obj = self.get(id_)
        payload = data.model_dump(exclude_unset=True)
        if "username" in payload:
            self._ensure_username_available(payload["username"], exclude_id=id_)
        if (
            id_ == current_user.id
            and "is_admin" in payload
            and payload["is_admin"] != obj.is_admin
        ):
            raise ForbiddenError("You cannot change your own role")
        return self.repo.update(obj, **payload)

    def update_profile(self, user: User, data: UserProfileUpdate) -> User:
        payload = data.model_dump(exclude_unset=True)
        return self.repo.update(user, **payload)

    def reset_password(self, id_: int, data: PasswordResetRequest) -> User:
        obj = self.get(id_)
        return self.repo.update(obj, password_hash=hash_password(data.password))
