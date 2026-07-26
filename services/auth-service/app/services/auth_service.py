"""Business logic auth: đăng ký, đăng nhập. Dùng lại libs.common.jwt + passlib."""

import bcrypt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest
from libs.common.config import settings
from libs.common.jwt import create_access_token


def _hash_password(password: str) -> str:
    """Hash password bằng bcrypt (tự sinh salt). bcrypt giới hạn 72 byte."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    """Kiểm password khớp hash; False nếu hash hỏng."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


class EmailAlreadyExists(Exception):
    """Email đã được đăng ký (→ 409)."""


class InvalidCredentials(Exception):
    """Email/password sai (→ 401)."""


def register(db: Session, data: RegisterRequest) -> User:
    """Tạo user mới; raise EmailAlreadyExists nếu email trùng."""
    exists = db.scalar(select(User).where(User.email == data.email))
    if exists is not None:
        raise EmailAlreadyExists

    user = User(
        email=data.email,
        password_hash=_hash_password(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login(db: Session, data: LoginRequest) -> tuple[str, int]:
    """Xác thực; trả (access_token, expires_in_seconds). Sai → InvalidCredentials."""
    user = db.scalar(select(User).where(User.email == data.email))
    if user is None or not _verify_password(data.password, user.password_hash):
        raise InvalidCredentials

    token = create_access_token(subject=str(user.id))
    return token, settings.jwt_expire_minutes * 60
