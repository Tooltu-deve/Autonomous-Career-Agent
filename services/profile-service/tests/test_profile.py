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


def test_put_profile_same_skills_update(client):
    _put_profile(client, skills=["python", "fastapi"])
    # PUT lại với cùng skills -> không bị xung đột unique constraint
    r = _put_profile(client, skills=["python", "fastapi"])
    assert r.status_code == 200
    assert [s["skill_name"] for s in r.json()["skills"]] == ["python", "fastapi"]


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


# ---- Certifications (SCRUM-66) ----
CERTS = [
    {
        "title": "AWS Certified Developer",
        "obtain_date": "2024-05-20",
        "display_order": 0,
    },
    {"title": "Azure Fundamentals", "obtain_date": "2023-11-02", "display_order": 1},
]


def test_put_profile_saves_certifications(client):
    r = _put_profile(client, certifications=CERTS)
    assert r.status_code == 200
    got = r.json()["certifications"]
    assert [c["title"] for c in got] == [
        "AWS Certified Developer",
        "Azure Fundamentals",
    ]
    assert got[0]["obtain_date"] == "2024-05-20"
    assert all("id" in c for c in got)


def test_get_profile_returns_certifications(client):
    _put_profile(client, certifications=CERTS)
    r = client.get("/profile", headers=HEADERS)
    assert r.status_code == 200
    assert [c["title"] for c in r.json()["certifications"]] == [
        "AWS Certified Developer",
        "Azure Fundamentals",
    ]


def test_put_profile_replaces_certifications(client):
    """PUT thay toàn bộ: gửi list mới -> không nhân đôi bản cũ."""
    _put_profile(client, certifications=CERTS)
    r = _put_profile(
        client,
        certifications=[{"title": "GCP ACE", "obtain_date": "2025-01-15"}],
    )
    assert r.status_code == 200
    assert [c["title"] for c in r.json()["certifications"]] == ["GCP ACE"]


def test_put_profile_without_certifications_clears_them(client):
    """Bỏ trống certifications -> xoá hết (hành vi PUT thay toàn bộ).

    Đây là lý do FE phải ride-along danh sách cũ khi màn hình không sửa mục này.
    """
    _put_profile(client, certifications=CERTS)
    r = _put_profile(client)  # body mặc định không có certifications
    assert r.status_code == 200
    assert r.json()["certifications"] == []


def test_certification_missing_obtain_date_422(client):
    r = _put_profile(client, certifications=[{"title": "No date"}])
    assert r.status_code == 422


def test_certification_missing_title_422(client):
    r = _put_profile(client, certifications=[{"obtain_date": "2024-05-20"}])
    assert r.status_code == 422


def test_certification_bad_date_format_422(client):
    r = _put_profile(
        client, certifications=[{"title": "X", "obtain_date": "20-05-2024"}]
    )
    assert r.status_code == 422
