"""Wrapper RabbitMQ dùng chung: publish / consume message JSON (pika)."""

import json
from typing import Callable

import pika

from libs.common.config import settings

# Tên các queue dùng chung trong hệ thống
QUEUE_CV_REQUESTED = "cv.requested"  # scraper -> cv-agent (kèm retry)
QUEUE_CV_GENERATED = "cv.generated"  # cv-agent -> ats-agent


def _connection() -> pika.BlockingConnection:
    """Mở kết nối tới RabbitMQ theo settings."""
    credentials = pika.PlainCredentials(
        settings.rabbitmq_user, settings.rabbitmq_password
    )
    params = pika.ConnectionParameters(
        host=settings.rabbitmq_host,
        port=settings.rabbitmq_port,
        credentials=credentials,
    )
    return pika.BlockingConnection(params)


def publish(queue: str, message: dict) -> None:
    """Đẩy một message (dict) vào queue dưới dạng JSON, persistent."""
    connection = _connection()
    try:
        channel = connection.channel()
        channel.queue_declare(queue=queue, durable=True)
        channel.basic_publish(
            exchange="",
            routing_key=queue,
            body=json.dumps(message).encode("utf-8"),
            properties=pika.BasicProperties(delivery_mode=2),  # persistent
        )
    finally:
        connection.close()


def consume(queue: str, handler: Callable[[dict], None]) -> None:
    """Lắng nghe queue, gọi handler cho mỗi message (JSON -> dict).

    Ack khi handler chạy xong; nack + requeue nếu handler raise.
    """
    connection = _connection()
    channel = connection.channel()
    channel.queue_declare(queue=queue, durable=True)
    channel.basic_qos(prefetch_count=1)

    def _on_message(ch, method, _properties, body) -> None:
        try:
            message = json.loads(body)
        except (ValueError, TypeError):
            # payload sai JSON: lỗi vĩnh viễn -> nack KHÔNG requeue (tránh
            # poison-message loop); consumer bỏ qua và chạy tiếp message sau.
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            return
        try:
            handler(message)
        except Exception:
            # handler lỗi: có thể tạm thời -> nack + requeue để giao lại.
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
            raise
        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_consume(queue=queue, on_message_callback=_on_message)
    try:
        channel.start_consuming()
    finally:
        connection.close()
