"""Consumer cv.generated: nghe queue -> ats_agent.process. Tự reconnect khi lỗi."""

import time

from pydantic import ValidationError

from app.core.db import SessionLocal
from app.services import ats_agent
from libs.common.logging import get_logger
from libs.messaging.rabbitmq import QUEUE_CV_GENERATED, consume
from libs.schemas.models import CvGenerated

logger = get_logger(__name__)

_RECONNECT_DELAY = 5  # giây, chờ trước khi kết nối lại sau lỗi


def _handle(msg: dict) -> None:
    """Xử lý 1 message. Payload sai schema -> bỏ qua (ack). Mỗi message 1 session."""
    try:
        event = CvGenerated(**msg)
    except ValidationError:
        logger.error("cv.generated sai schema, bỏ qua: %s", msg)
        return  # return bình thường -> libs ack -> không requeue poison

    db = SessionLocal()
    try:
        ats_agent.process(db, event)
    finally:
        db.close()


def run() -> None:
    """Vòng lặp consume + tự reconnect.

    consume() blocking; thoát ra khi (a) RabbitMQ chưa sẵn lúc startup, hoặc
    (b) handler ném lỗi tạm thời (libs nack+requeue rồi raise). Cả hai đều được
    bắt ở đây -> chờ backoff -> nghe lại, nên thread consumer KHÔNG chết vĩnh viễn.
    """
    while True:
        try:
            logger.info("ats-agent consumer: nghe %s", QUEUE_CV_GENERATED)
            consume(QUEUE_CV_GENERATED, _handle)
        except Exception:
            logger.exception("Consumer dừng vì lỗi; thử lại sau %ds", _RECONNECT_DELAY)
            time.sleep(_RECONNECT_DELAY)
