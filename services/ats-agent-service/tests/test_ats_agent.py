"""Tests ats_agent.process: gate PASS/retry/needs_review + các nhánh lỗi.

Mock ranh giới ngoài: LLM (get_llm_client), RabbitMQ (publish). DB = SQLite.
"""

import json
from unittest.mock import MagicMock

import pytest
from app.models.report import AtsReportORM
from app.services import ats_agent

from libs.schemas.models import CvGenerated
from tests.conftest import CV_ID, JOB_ID, USER_ID, seed_pipeline

_SCORING_PASS = json.dumps(
    {
        "overall_score": 85,
        "score_breakdown": {"keywords": 80, "experience": 90},
        "matched_keywords": ["python", "fastapi"],
        "missing_keywords": ["kubernetes"],
        "recommendations": [
            {"type": "add", "title": "CI/CD", "body": "Thêm mục CI/CD"}
        ],
    }
)
_COVER_LETTER = "Dear Hiring Manager, tôi rất phù hợp với vị trí này."


@pytest.fixture(autouse=True)
def mock_publish(monkeypatch):
    """Chặn publish thật; ghi lại các lần gọi (queue, message)."""
    calls: list = []
    monkeypatch.setattr(ats_agent, "publish", lambda q, m: calls.append((q, m)))
    return calls


def _mock_llm(monkeypatch, scoring=_SCORING_PASS, letter=_COVER_LETTER):
    """LLM giả: lần gọi 1 trả JSON chấm điểm, lần 2 trả cover letter."""
    client = MagicMock()
    client.complete.side_effect = [scoring, letter]
    monkeypatch.setattr(ats_agent, "get_llm_client", lambda: client)
    return client


def _msg() -> CvGenerated:
    return CvGenerated(cv_generation_id=str(CV_ID))


def test_process_pass_writes_report_and_completes(db, monkeypatch, mock_publish):
    app_row = seed_pipeline(db)
    _mock_llm(monkeypatch)

    report_id = ats_agent.process(db, _msg())

    row = db.get(AtsReportORM, report_id)
    assert row.overall_score == 85
    assert row.cover_letter_text == _COVER_LETTER
    assert row.cv_generation_id == CV_ID
    db.refresh(app_row)
    assert app_row.generation_status == "completed"
    assert mock_publish == []  # PASS -> không republish


_SCORING_FAIL = json.dumps(
    {
        "overall_score": 40,
        "score_breakdown": {"keywords": 30},
        "matched_keywords": ["python"],
        "missing_keywords": ["kubernetes", "docker"],
        "recommendations": [
            {"type": "add", "title": "DevOps", "body": "Bổ sung kinh nghiệm Docker"}
        ],
    }
)


def test_process_fail_republishes_with_feedback(db, monkeypatch, mock_publish):
    app_row = seed_pipeline(db, attempt=1)
    _mock_llm(monkeypatch, scoring=_SCORING_FAIL)

    report_id = ats_agent.process(db, _msg())

    assert report_id is not None
    db.refresh(app_row)
    assert app_row.generation_status == "cv_queued"
    assert app_row.attempt == 2
    queue, message = mock_publish[0]
    assert queue == "cv.requested"
    assert message["user_id"] == str(USER_ID)
    assert message["job_id"] == str(JOB_ID)
    assert message["attempt"] == 2
    assert "kubernetes" in message["feedback"]
    assert "40/100" in message["feedback"]


def test_process_fail_at_max_attempts_needs_review(db, monkeypatch, mock_publish):
    app_row = seed_pipeline(db, attempt=3)  # = ATS_MAX_ATTEMPTS mặc định
    _mock_llm(monkeypatch, scoring=_SCORING_FAIL)

    report_id = ats_agent.process(db, _msg())

    assert report_id is not None  # report vẫn được ghi để user xem
    db.refresh(app_row)
    assert app_row.generation_status == "needs_review"
    assert app_row.attempt == 3  # không tăng nữa
    assert mock_publish == []


def test_process_retry_overwrites_old_report(db, monkeypatch, mock_publish):
    seed_pipeline(db)
    _mock_llm(monkeypatch, scoring=_SCORING_FAIL)
    first_id = ats_agent.process(db, _msg())

    _mock_llm(monkeypatch, scoring=_SCORING_PASS)
    second_id = ats_agent.process(db, _msg())

    assert first_id == second_id  # 1:1 — cùng row, ghi đè
    row = db.get(AtsReportORM, second_id)
    assert row.overall_score == 85


def test_process_missing_cv_returns_none(db, monkeypatch, mock_publish):
    seed_pipeline(db, with_cv=False)
    _mock_llm(monkeypatch)

    assert ats_agent.process(db, _msg()) is None
    assert mock_publish == []


def test_process_invalid_uuid_returns_none(db, monkeypatch, mock_publish):
    _mock_llm(monkeypatch)
    msg = CvGenerated.model_construct(schema_version=1, cv_generation_id="not-a-uuid")

    assert ats_agent.process(db, msg) is None


def test_process_bad_llm_json_marks_failed(db, monkeypatch, mock_publish):
    app_row = seed_pipeline(db)
    _mock_llm(monkeypatch, scoring="xin lỗi, tôi không thể chấm điểm")

    assert ats_agent.process(db, _msg()) is None
    db.refresh(app_row)
    assert app_row.generation_status == "failed"
    assert mock_publish == []
