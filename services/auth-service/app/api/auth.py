"""Route handlers cho auth — mỏng: validate input, gọi services/, map lỗi → HTTP."""

import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def current_user_id(x_user_id: str = Header(..., alias="X-User-Id")) -> uuid.UUID:
    """user_id do gateway verify JWT rồi truyền xuống (route /auth/me)."""
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "X-User-Id không hợp lệ")


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(data: RegisterRequest, db: Session = Depends(get_db)) -> UserResponse:
    try:
        user = auth_service.register(db, data)
    except auth_service.EmailAlreadyExists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email đã được đăng ký"
        )
    return UserResponse.model_validate(user)


@router.get("/me", response_model=UserResponse)
def me(
    user_id: uuid.UUID = Depends(current_user_id), db: Session = Depends(get_db)
) -> UserResponse:
    """Thông tin user hiện tại — FE dùng hiển thị tên sau khi login."""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User không tồn tại"
        )
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        token, expires_in = auth_service.login(db, data)
    except auth_service.InvalidCredentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng",
        )
    return TokenResponse(access_token=token, expires_in=expires_in)
