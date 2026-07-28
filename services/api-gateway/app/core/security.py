"""Verify JWT in Gateway"""

from fastapi import HTTPException, status
from jose import JWTError

from libs.common.jwt import decode_token


def extract_user_id(authorization: str | None) -> str:
    """Verify Bearer token and return user_id(sub)"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Thiếu bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Token không hợp lệ hoặc hết hạn"
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token thiếu subject")
    return user_id
