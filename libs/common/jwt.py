"""JWT dùng chung: cấp/verify access token (auth-service + api-gateway)."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt

from libs.common.config import settings


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    """Tạo access token với `sub=subject` và thời hạn theo settings."""
    minutes = (
        expires_minutes if expires_minutes is not None else settings.jwt_expire_minutes
    )
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """Giải mã + verify token; raise `JWTError` nếu sai/hết hạn."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
