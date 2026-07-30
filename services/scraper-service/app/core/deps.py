"""Dependency dùng chung trong scraper-service."""

from fastapi import Header, HTTPException, status


def get_current_user_id(
    x_user_id: str | None = Header(None, alias="X-User-Id"),
) -> str:
    """Lấy user_id từ header do API Gateway truyền xuống.

    API Gateway đã verify JWT và gắn `X-User-Id` vào header.
    Service không cần verify lại JWT nữa.
    """
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thiếu X-User-Id từ API Gateway.",
        )
    return x_user_id
