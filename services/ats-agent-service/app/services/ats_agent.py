"""Orchestrator ats-agent: CvGenerated -> đọc DB -> LLM chấm điểm + cover letter
-> ghi ats_reports -> cổng PASS/FAIL/NEEDS_REVIEW (retry qua cv.requested)."""

import json
import uuid
from typing import Literal

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models.job import JobORM
from app.schemas.scoring import ScoringOutput
from app.services import readers, report_repository
from libs.common.config import settings
from libs.common.logging import get_logger
from libs.llm.adapter import get_llm_client
from libs.llm.prompts import ats_scoring, cover_letter
from libs.messaging.rabbitmq import QUEUE_CV_REQUESTED, publish
from libs.schemas.models import ATSReport, CvGenerated, CvRequest

logger = get_logger(__name__)

Decision = Literal["completed", "retry", "needs_review"]


def _parse_scoring(raw: str) -> ScoringOutput:
    """Ép chuỗi LLM -> ScoringOutput. Lấy đoạn JSON từ '{' đầu tới '}' cuối.

    Cách này bền hơn tách rào ```: bỏ được prose thừa trước/sau, và rào json.
    Không tìm thấy object -> raise (coi như output hỏng, permanent).
    """
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1 or start > end:
        raise ValueError("LLM không trả JSON object")
    return ScoringOutput(**json.loads(raw[start : end + 1]))


def _format_jd(job: JobORM) -> str:
    """Ghép JD thành text cho prompt."""
    return f"{job.title} — {job.company} ({job.location or 'N/A'})\n\n{job.description}"


def _decide(score: int, attempt: int) -> Decision:
    """Cổng PASS/FAIL: đạt ngưỡng -> completed; còn lượt -> retry; hết -> review."""
    if score >= settings.ats_pass_threshold:
        return "completed"
    if attempt < settings.ats_max_attempts:
        return "retry"
    return "needs_review"


def _build_feedback(report: ATSReport) -> str:
    """Gom weaknesses/advice từ report thành feedback cho lần sinh CV lại."""
    lines = [f"Điểm ATS lần trước: {report.overall_score}/100 (dưới ngưỡng)."]
    if report.missing_keywords:
        lines.append("Keywords còn thiếu: " + ", ".join(report.missing_keywords))
    for rec in report.recommendations:
        lines.append(f"- {rec.title}: {rec.body}")
    return "\n".join(lines)


def process(db: Session, msg: CvGenerated) -> uuid.UUID | None:
    """Chấm điểm một bản CV. Trả ats_reports.id; None nếu lỗi PERMANENT.

    Chiến lược lỗi (mirror cv-agent):
    - Permanent (UUID hỏng, thiếu cv/application/job, LLM trả JSON xấu):
      log + đánh dấu `failed` (nếu có application) rồi return None -> consumer
      ACK, KHÔNG requeue (retry cũng vô ích).
    - Tạm thời (LLM/DB/publish exception): để raise -> consumer nack+requeue.
    """
    try:
        cv_id = uuid.UUID(msg.cv_generation_id)
    except (ValueError, AttributeError, TypeError):
        logger.error("CvGenerated UUID không hợp lệ, bỏ qua | %s", msg)
        return None

    cv = readers.read_cv(db, cv_id)
    if cv is None:
        logger.error("Không có cv_generation, bỏ qua | cv_id=%s", cv_id)
        return None

    application = readers.read_application(db, cv.application_id)
    if application is None:
        logger.error("Không có application, bỏ qua | app_id=%s", cv.application_id)
        return None

    report_repository.set_generation_status(db, application, "ats_scoring")

    job = readers.read_job(db, application.job_id)
    if job is None:
        logger.error("Thiếu job -> failed | job_id=%s", application.job_id)
        report_repository.set_generation_status(db, application, "failed")
        return None

    cv_json_str = json.dumps(cv.cv_json, ensure_ascii=False)
    jd = _format_jd(job)
    llm = get_llm_client()

    raw = llm.complete(*ats_scoring(cv_json_str, jd))  # lỗi mạng -> raise (tạm thời)
    try:
        scoring = _parse_scoring(raw)
    except (ValueError, TypeError, ValidationError):
        logger.exception(
            "LLM trả scoring không hợp lệ -> failed | app=%s", application.id
        )
        report_repository.set_generation_status(db, application, "failed")
        return None

    letter = llm.complete(*cover_letter(cv_json_str, jd))
    report = ATSReport(
        **scoring.model_dump(),
        cover_letter_text=letter,
        model_used=settings.llm_model,
    )
    row = report_repository.upsert_report(db, cv_id, report)

    decision = _decide(report.overall_score, application.attempt)
    if decision == "completed":
        report_repository.set_generation_status(db, application, "completed")
    elif decision == "retry":
        application.attempt += 1
        report_repository.set_generation_status(db, application, "cv_queued")
        publish(
            QUEUE_CV_REQUESTED,
            CvRequest(
                user_id=str(application.user_id),
                job_id=str(application.job_id),
                attempt=application.attempt,
                feedback=_build_feedback(report),
            ).model_dump(),
        )
    else:
        report_repository.set_generation_status(db, application, "needs_review")

    logger.info(
        "Chấm điểm xong | report=%s score=%s decision=%s",
        row.id,
        report.overall_score,
        decision,
    )
    return row.id
