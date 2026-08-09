from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.models.user import User
from app.schemas.user import PasswordResetRequest, UserCreate, UserRead, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)
) -> list[UserRead]:
    return UserService(db).list()


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> UserRead:
    return UserService(db).create(payload)


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> UserRead:
    return UserService(db).update(user_id, payload, current_user)


@router.post("/{user_id}/reset-password", response_model=UserRead)
def reset_password(
    user_id: int,
    payload: PasswordResetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> UserRead:
    return UserService(db).reset_password(user_id, payload)
