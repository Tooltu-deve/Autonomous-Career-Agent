import httpx
import pytest
from app.main import app
from fastapi.testclient import TestClient

from libs.common.jwt import create_access_token


def _handler(request: httpx.Request) -> httpx.Response:
    # giả lập downstream: echo path + header X-User-Id nhận được
    return httpx.Response(
        200, json={"path": request.url.path, "uid": request.headers.get("x-user-id")}
    )


@pytest.fixture()
def client():
    app.state.http_client = httpx.AsyncClient(transport=httpx.MockTransport(_handler))
    return TestClient(app)


def test_health(client):
    assert client.get("/health").json()["service"] == "api-gateway"


def test_public_route_no_token(client):
    r = client.post("/auth/login", json={})
    assert r.status_code == 200
    assert r.json()["uid"] is None  # public không gắn X-User-Id


def test_protected_without_token_401(client):
    assert client.get("/profile").status_code == 401


def test_protected_with_valid_token_injects_uid(client):
    token = create_access_token(subject="user-123")
    r = client.get("/profile", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["uid"] == "user-123"


def test_bad_token_401(client):
    r = client.get("/profile", headers={"Authorization": "Bearer garbage"})
    assert r.status_code == 401


def test_unknown_path_404(client):
    assert client.get("/nope").status_code == 404


def test_auth_me_requires_token(client):
    assert client.get("/auth/me").status_code == 401


def test_auth_me_with_token_injects_uid(client):
    token = create_access_token(subject="user-123")
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json() == {"path": "/auth/me", "uid": "user-123"}


@pytest.mark.parametrize("origin", ["http://localhost:3000", "http://127.0.0.1:3000"])
def test_cors_preflight_allows_frontend_origins(client, origin):
    # Browser coi localhost và 127.0.0.1 là hai origin khác nhau — cả hai phải pass.
    r = client.options(
        "/auth/register",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] == origin
