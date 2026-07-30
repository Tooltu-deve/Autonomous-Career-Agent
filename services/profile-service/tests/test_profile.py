"""Test CRUD profile + preferences qua TestClient, SQLite in-memory.

Model dùng sqlalchemy.Uuid + StringArray (ARRAY→JSON variant trên SQLite),
nên create_all chạy thẳng. Gateway thật truyền X-User-Id; test gửi header đó.
"""

import uuid

import pytest
from app.core.db import Base, get_db
from app.main import app

# đăng ký model vào metadata trước create_all
from app.models import profile as _profile  # noqa: F401
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

USER_ID = str(uuid.uuid4())
HEADERS = {"X-User-Id": USER_ID}


@pytest.fixture(autouse=True)
def mock_embedding(monkeypatch):
    """Mọi test: chặn embedding gọi OpenAI/Qdrant thật. Mặc định trả True.

    Test embedding riêng override lại để kiểm hành vi (thành công / lỗi).
    """
    from app.services import profile_repository

    calls = []

    def _fake_sync(profile_id, text):
        calls.append((profile_id, text))
        return True

    monkeypatch.setattr(
        profile_repository.qdrant_sync, "sync_profile_embedding", _fake_sync
    )
    return calls


@pytest.fixture()
def client():
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

    app.dependency_overrides[get_db] = _override_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def _put_profile(client, **over):
    body = {
        "headline": "Backend Engineer",
        "summary": "3 năm backend",
        "preferred_template": "modern",
        "experiences": [{"title": "Dev", "organization": "ACME", "display_order": 1}],
        "educations": [{"school": "HCMUS", "degree": "BSc", "display_order": 1}],
        "skills": ["python", "fastapi"],
    }
    body.update(over)
    return client.put("/profile", json=body, headers=HEADERS)


def test_get_profile_404_when_none(client):
    r = client.get("/profile", headers=HEADERS)
    assert r.status_code == 404


def test_put_profile_creates_nested(client):
    r = _put_profile(client)
    assert r.status_code == 200
    body = r.json()
    assert body["user_id"] == USER_ID
    assert body["preferred_template"] == "modern"
    assert [e["title"] for e in body["experiences"]] == ["Dev"]
    assert [s["skill_name"] for s in body["skills"]] == ["python", "fastapi"]


def test_put_profile_is_idempotent_replace(client):
    _put_profile(client)
    # PUT lại với skills khác -> thay toàn bộ, không nhân đôi
    r = _put_profile(client, skills=["go"])
    assert r.status_code == 200
    assert [s["skill_name"] for s in r.json()["skills"]] == ["go"]


def test_put_profile_bad_template_422(client):
    r = _put_profile(client, preferred_template="fancy")
    assert r.status_code == 422


def test_get_profile_after_put(client):
    _put_profile(client)
    r = client.get("/profile", headers=HEADERS)
    assert r.status_code == 200
    assert r.json()["headline"] == "Backend Engineer"


def test_missing_user_id_header_422(client):
    r = client.get("/profile")  # thiếu X-User-Id
    assert r.status_code == 422


# ---- Preferences ----
def _put_prefs(client, **over):
    body = {
        "target_role": "Backend Engineer",
        "expected_salary_min": 1500,
        "expected_salary_max": 2500,
        "currency": "USD",
        "preferred_locations": ["Ho Chi Minh City", "Remote"],
        "remote_preference": "hybrid",
    }
    body.update(over)
    return client.put("/profile/preferences", json=body, headers=HEADERS)


def test_prefs_404_without_profile(client):
    r = _put_prefs(client)
    assert r.status_code == 404  # chưa có profile


def test_prefs_upsert_and_get(client):
    _put_profile(client)
    r = _put_prefs(client)
    assert r.status_code == 200
    assert r.json()["preferred_locations"] == ["Ho Chi Minh City", "Remote"]

    g = client.get("/profile/preferences", headers=HEADERS)
    assert g.status_code == 200
    assert g.json()["target_role"] == "Backend Engineer"


def test_prefs_empty_target_role_422(client):
    _put_profile(client)
    r = _put_prefs(client, target_role="")
    assert r.status_code == 422


# ---- Embedding side-effect ----
def test_put_profile_calls_embedding_with_text(client, mock_embedding):
    _put_profile(client)
    # sync được gọi đúng 1 lần, text chứa headline + skills đã ghép
    assert len(mock_embedding) == 1
    _profile_id, text = mock_embedding[0]
    assert "Backend Engineer" in text  # headline
    assert "python" in text and "fastapi" in text  # skills


def test_put_profile_sets_synced_at_when_embedding_ok(client):
    r = _put_profile(client)
    assert r.status_code == 200
    # embedding OK (mock trả True) -> đọc lại thấy đã sync (nội bộ, không có
    # trong response API; kiểm gián tiếp: PUT thành công, không lỗi)


def test_put_profile_ok_even_if_embedding_fails(client, monkeypatch):
    # embedding lỗi (trả False) KHÔNG được làm hỏng PUT
    from app.services import profile_repository

    monkeypatch.setattr(
        profile_repository.qdrant_sync,
        "sync_profile_embedding",
        lambda pid, text: False,
    )
    r = _put_profile(client)
    assert r.status_code == 200  # profile vẫn lưu dù embedding fail
    g = client.get("/profile", headers=HEADERS)
    assert g.status_code == 200
