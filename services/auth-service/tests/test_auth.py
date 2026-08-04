"""Test register/login qua TestClient, DB SQLite in-memory (không cần Postgres).

Model dùng `sqlalchemy.Uuid` (portable: UUID trên Postgres, CHAR trên SQLite),
nên create_all chạy thẳng trên engine test. StaticPool giữ chung 1 connection
để request thấy bảng vừa tạo. Đủ để kiểm luồng đăng ký/đăng nhập + mã lỗi.
"""

import pytest
from app.core.db import Base, get_db
from app.main import app

# đảm bảo model User được đăng ký vào Base.metadata trước create_all
from app.models import user as _user  # noqa: F401
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture()
def client():
    # SQLite in-memory dùng chung 1 connection (StaticPool) cho cả request
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def _override_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    # id mặc định uuid4 (Base default) vẫn chạy vì lưu dạng string
    app.dependency_overrides[get_db] = _override_db
    yield TestClient(app)
    app.dependency_overrides.clear()


EMAIL = "user@example.com"
PASSWORD = (
    "test-pw-1234"  # pragma: allowlist secret — giá trị test, không phải secret thật
)
FULL_NAME = "Nguyen A"


def _register(client, email=EMAIL, pw=PASSWORD, name=FULL_NAME):
    return client.post(
        "/auth/register",
        json={"email": email, "password": pw, "full_name": name},
    )


def test_register_returns_201_with_user(client):
    r = _register(client)
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == EMAIL
    assert body["full_name"] == FULL_NAME
    assert "id" in body and "created_at" in body
    assert "password" not in body and "password_hash" not in body


def test_register_duplicate_email_returns_409(client):
    _register(client)
    r = _register(client)
    assert r.status_code == 409


def test_register_short_password_returns_422(client):
    r = _register(client, pw="short")
    assert r.status_code == 422


def test_login_returns_token(client):
    _register(client)
    r = client.post("/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["expires_in"] > 0


def test_login_wrong_password_returns_401(client):
    _register(client)
    r = client.post("/auth/login", json={"email": EMAIL, "password": "not-" + PASSWORD})
    assert r.status_code == 401


def test_login_unknown_email_returns_401(client):
    r = client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": PASSWORD}
    )
    assert r.status_code == 401


def test_me_returns_current_user(client):
    user_id = _register(client).json()["id"]
    r = client.get("/auth/me", headers={"X-User-Id": user_id})
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == user_id
    assert body["email"] == EMAIL
    assert body["full_name"] == FULL_NAME


def test_me_unknown_user_returns_404(client):
    import uuid

    r = client.get("/auth/me", headers={"X-User-Id": str(uuid.uuid4())})
    assert r.status_code == 404


def test_me_invalid_user_id_returns_400(client):
    r = client.get("/auth/me", headers={"X-User-Id": "not-a-uuid"})
    assert r.status_code == 400
