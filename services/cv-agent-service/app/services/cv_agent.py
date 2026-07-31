"""Orchestrator cv-agent: CvRequest -> đọc Postgres -> LLM -> lưu -> publish."""

import json
import uuid

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.services import cv_repository, readers
from libs.common.config import settings
from libs.common.logging import get_logger
from libs.llm.adapter import get_llm_client
from libs.llm.prompts import cv_generation
from libs.messaging.rabbitmq import QUEUE_CV_GENERATED, publish
from libs.schemas.models import CVContent, CvGenerated, CvRequest

logger = get_logger(__name__)


def _parse_cv(raw: str) -> CVContent:
    """Ép chuỗi LLM -> CVContent. Lấy đoạn JSON từ '{' đầu tới '}' cuối.

    Cách này bền hơn tách rào ```: bỏ được prose thừa trước/sau, và rào json.
    Không tìm thấy object -> raise (coi như output hỏng, permanent).
    """
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1 or start > end:
        raise ValueError("LLM không trả JSON object")
    return CVContent(**json.loads(raw[start : end + 1]))


def _format_jd(job) -> str:
    """Ghép JD thành text cho prompt."""
    return f"{job.title} — {job.company} ({job.location or 'N/A'})\n\n{job.description}"


def generate(db: Session, req: CvRequest) -> uuid.UUID | None:
    """Sinh CV cho một CvRequest. Trả cv_generation_id; None nếu lỗi PERMANENT.

    Chiến lược lỗi:
    - Permanent (UUID hỏng, thiếu application/profile/job, LLM trả JSON xấu):
      log + đánh dấu `failed` (nếu có application) rồi return None -> consumer ACK,
      KHÔNG requeue (retry cũng vô ích).
    - Tạm thời (LLM/DB/publish exception): để raise -> consumer nack+requeue thử lại.
    """
    try:
        user_id = uuid.UUID(req.user_id)
        job_id = uuid.UUID(req.job_id)
    except (ValueError, AttributeError, TypeError):
        logger.error("CvRequest UUID không hợp lệ, bỏ qua | %s", req)
        return None

    application = cv_repository.get_application(db, user_id, job_id)
    if application is None:
        logger.error("Không có application, bỏ qua | user=%s job=%s", user_id, job_id)
        return None

    cv_repository.set_generation_status(db, application, "cv_generating")

    profile = readers.read_profile(db, user_id)
    job = readers.read_job(db, job_id)
    if profile is None or job is None:
        logger.error("Thiếu profile/job -> failed | user=%s job=%s", user_id, job_id)
        cv_repository.set_generation_status(db, application, "failed")
        return None

    system, prompt = cv_generation(
        profile_json=json.dumps(profile, ensure_ascii=False),
        job_description=_format_jd(job),
        feedback=req.feedback,
    )
    raw = get_llm_client().complete(system, prompt)  # lỗi mạng -> raise (tạm thời)

    try:
        content = _parse_cv(raw)
    except (ValueError, TypeError, ValidationError):
        logger.exception(
            "LLM trả output không hợp lệ -> failed | app=%s", application.id
        )
        cv_repository.set_generation_status(db, application, "failed")
        return None

    cv = cv_repository.upsert_cv_generation(
        db, application.id, content.model_dump(), model_used=settings.llm_model
    )
    cv_repository.set_generation_status(db, application, "cv_generated")

    publish(QUEUE_CV_GENERATED, CvGenerated(cv_generation_id=str(cv.id)).model_dump())
    logger.info("Sinh CV xong | cv_generation_id=%s", cv.id)
    return cv.id
