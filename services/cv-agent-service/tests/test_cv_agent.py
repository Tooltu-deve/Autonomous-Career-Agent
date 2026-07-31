"""Tests cv-agent: consumer core (cv_agent.generate) + API /cvs.

Mock ranh giới ngoài: LLM (get_llm_client), RabbitMQ (publish). DB = SQLite.
"""

import json
import uuid
from unittest.mock import MagicMock

import pytest
from app.core.db import Base, get_db
from app.main import app
from app.models.application import ApplicationORM
from app.models.cv import CvGenerationORM
from app.models.job import JobORM
from app.models.profile import ProfileExperienceORM, ProfileORM, ProfileSkillORM
from app.services import cv_agent
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from libs.schemas.models import CvRequest

USER_ID = uuid.uuid4()
JOB_ID = uuid.uuid4()

_VALID_CV = json.dumps(
    {
        "summary": "Backend engineer 3 năm",
        "experience": [{"title": "Dev", "organization": "ACME"}],
        "education": [],
        "skills": ["python"],
    }
)


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    s = Session()
    try:
        yield s
    finally:
        s.close()


@pytest.fixture(autouse=True)
def mock_publish(monkeypatch):
    """Chặn publish thật; ghi lại các lần gọi."""
    calls: list = []
    monkeypatch.setattr(cv_agent, "publish", lambda q, m: calls.append((q, m)))
    return calls


def _mock_llm(monkeypatch, output=_VALID_CV):
    client = MagicMock()
    client.complete.return_value = output
    monkeypatch.setattr(cv_agent, "get_llm_client", lambda: client)
    return client


def _seed(db, *, with_profile=True) -> ApplicationORM:
    db.add(
        JobORM(
            id=JOB_ID,
            title="Backend Engineer",
            company="ACME",
            location="HCMC",
            description="Build Python APIs",
        )
    )
    app_row = ApplicationORM(
        id=uuid.uuid4(),
        user_id=USER_ID,
        job_id=JOB_ID,
        generation_status="cv_queued",
        attempt=1,
    )
    db.add(app_row)
    if with_profile:
        p = ProfileORM(
            id=uuid.uuid4(),
            user_id=USER_ID,
            headline="Backend Engineer",
            summary="3 năm Python",
        )
        p.experiences = [
            ProfileExperienceORM(
                id=uuid.uuid4(), title="Dev", organization="ACME", display_order=1
            )
        ]
        p.skills = [ProfileSkillORM(id=uuid.uuid4(), skill_name="python")]
        db.add(p)
    db.commit()
    return app_row


# ---- cv_agent.generate ----
def test_generate_success(db, monkeypatch, mock_publish):
    app_row = _seed(db)
    _mock_llm(monkeypatch)

    cv_id = cv_agent.generate(db, CvRequest(user_id=str(USER_ID), job_id=str(JOB_ID)))

    cv = db.get(CvGenerationORM, cv_id)
    assert cv.cv_json["summary"].startswith("Backend")
    assert cv.edit_status == "draft"
    db.refresh(app_row)
    assert app_row.generation_status == "cv_generated"
    assert mock_publish[0][1]["cv_generation_id"] == str(cv_id)


def test_generate_missing_profile_marks_failed(db, monkeypatch, mock_publish):
    app_row = _seed(db, with_profile=False)
    _mock_llm(monkeypatch)

    result = cv_agent.generate(db, CvRequest(user_id=str(USER_ID), job_id=str(JOB_ID)))

    assert result is None
    db.refresh(app_row)
    assert app_row.generation_status == "failed"
    assert mock_publish == []


def test_generate_passes_feedback_to_prompt(db, monkeypatch, mock_publish):
    _seed(db)
    client = _mock_llm(monkeypatch)
    cv_agent.generate(
        db,
        CvRequest(
            user_id=str(USER_ID),
            job_id=str(JOB_ID),
            attempt=2,
            feedback="Thêm kỹ năng Docker",
        ),
    )
    _system, prompt = client.complete.call_args.args
    assert "Docker" in prompt


def test_generate_missing_application_acks(db, monkeypatch, mock_publish):
    # Không seed -> không có application. Lỗi permanent -> return None, KHÔNG raise.
    _mock_llm(monkeypatch)
    result = cv_agent.generate(db, CvRequest(user_id=str(USER_ID), job_id=str(JOB_ID)))
    assert result is None
    assert mock_publish == []


def test_generate_bad_uuid_acks(db, monkeypatch, mock_publish):
    # user_id không phải UUID -> permanent -> return None, không raise.
    _mock_llm(monkeypatch)
    result = cv_agent.generate(db, CvRequest(user_id="not-a-uuid", job_id="also-bad"))
    assert result is None
    assert mock_publish == []


def test_generate_bad_llm_output_marks_failed(db, monkeypatch, mock_publish):
    app_row = _seed(db)
    _mock_llm(monkeypatch, output="Xin lỗi, tôi không thể tạo CV.")  # không có JSON

    result = cv_agent.generate(db, CvRequest(user_id=str(USER_ID), job_id=str(JOB_ID)))

    assert result is None
    db.refresh(app_row)
    assert app_row.generation_status == "failed"  # không kẹt cv_generating
    assert mock_publish == []


def test_consumer_drops_invalid_message():
    # Payload sai schema -> _handle bỏ qua, KHÔNG raise (libs sẽ ack).
    from app.services import consumer

    consumer._handle({"foo": "bar"})  # thiếu user_id/job_id


# ---- API /cvs ----
@pytest.fixture()
def client(db, monkeypatch):
    monkeypatch.setattr(
        "app.services.consumer.run", lambda: None
    )  # không spawn consumer
    app.dependency_overrides[get_db] = lambda: db
    yield TestClient(app)
    app.dependency_overrides.clear()


def _seed_cv(db) -> CvGenerationORM:
    app_row = _seed(db)
    cv = CvGenerationORM(
        id=uuid.uuid4(),
        application_id=app_row.id,
        cv_json={"summary": "s", "experience": [], "education": [], "skills": []},
        edit_status="draft",
        model_used="claude-opus-4-8",
    )
    db.add(cv)
    db.commit()
    return cv


def test_get_cv_200(client, db):
    cv = _seed_cv(db)
    r = client.get(f"/cvs/{cv.id}", headers={"X-User-Id": str(USER_ID)})
    assert r.status_code == 200
    assert r.json()["id"] == str(cv.id)


def test_get_cv_wrong_user_404(client, db):
    cv = _seed_cv(db)
    r = client.get(f"/cvs/{cv.id}", headers={"X-User-Id": str(uuid.uuid4())})
    assert r.status_code == 404


def test_put_cv_marks_edited(client, db):
    cv = _seed_cv(db)
    body = {
        "cv_json": {
            "summary": "sửa rồi",
            "experience": [],
            "education": [],
            "skills": ["go"],
        }
    }
    r = client.put(f"/cvs/{cv.id}", json=body, headers={"X-User-Id": str(USER_ID)})
    assert r.status_code == 200
    assert r.json()["edit_status"] == "edited"


def test_put_cv_bad_schema_422(client, db):
    cv = _seed_cv(db)
    body = {"cv_json": {"experience": []}}  # thiếu summary
    r = client.put(f"/cvs/{cv.id}", json=body, headers={"X-User-Id": str(USER_ID)})
    assert r.status_code == 422
