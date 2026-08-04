"""Table-driven proxy: match prefix -> verify (nếu cần) -> forward."""

from fastapi import APIRouter, HTTPException, Request, Response

from app.core.security import extract_user_id
from app.services.forwarder import forward
from libs.common.config import settings

ROUTES = [
    # /auth/me cần user_id từ token → đặt TRƯỚC /auth (match theo thứ tự).
    {"prefix": "/auth/me", "url": settings.auth_service_url, "auth": True},
    {"prefix": "/auth", "url": settings.auth_service_url, "auth": False},
    {"prefix": "/profile", "url": settings.profile_service_url, "auth": True},
    {"prefix": "/jobs", "url": settings.scraper_service_url, "auth": True},
    {"prefix": "/cvs", "url": settings.cv_service_url, "auth": True},
    {"prefix": "/applications", "url": settings.ats_service_url, "auth": True},
    {"prefix": "/pdf", "url": settings.pdf_service_url, "auth": True},
]

router = APIRouter()


def _match(path: str) -> dict | None:
    for route in ROUTES:
        if path == route["prefix"] or path.startswith(route["prefix"] + "/"):
            return route
    return None


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy(path: str, request: Request) -> Response:
    route = _match("/" + path)
    if route is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy route")
    extra = None
    if route["auth"]:
        user_id = extract_user_id(request.headers.get("authorization"))
        extra = {"X-User-Id": user_id}
    return await forward(request.app.state.http_client, route["url"], request, extra)
