"""Wrapper RabbitMQ dùng chung: publish / consume message JSON.

Kết nối bằng pika (blocking). Mọi payload được serialize/deserialize JSON.
Cấu hình đọc từ ``libs.common.config.settings`` (không đọc biến môi trường trực tiếp).
"""

import json
from typing import Callable

import pika

from libs.common.config import settings

# Tên các queue dùng chung trong hệ thống
QUEUE_JOBS_SCRAPED = "jobs.scraped"  # scraper -> cv-agent
QUEUE_CV_GENERATED = "cv.generated"  # cv-agent -> ats-agent


def _connection_params() -> pika.ConnectionParameters:
    """Tham số kết nối RabbitMQ, lấy từ settings."""
    credentials = pika.PlainCredentials(
        settings.rabbitmq_user, settings.rabbitmq_password
    )
    return pika.ConnectionParameters(
        host=settings.rabbitmq_host,
        port=settings.rabbitmq_port,
        credentials=credentials,
        heartbeat=600,
        blocked_connection_timeout=300,
    )


def publish(queue: str, message: dict) -> None:
    """Đẩy một message (dict) vào queue.

    Queue được khai báo ``durable=True`` và message ``delivery_mode=2`` để
    message không mất khi RabbitMQ khởi động lại.
    """
    payload = json.dumps(message)
    connection = pika.BlockingConnection(_connection_params())
    try:
        channel = connection.channel()
        channel.queue_declare(queue=queue, durable=True)
        channel.basic_publish(
            exchange="",
            routing_key=queue,
            body=payload,
            properties=pika.BasicProperties(
                content_type="application/json",
                delivery_mode=2,  # persistent
            ),
        )
    finally:
        connection.close()


def consume(queue: str, handler: Callable[[dict], None]) -> None:
    """Lắng nghe queue, gọi ``handler`` cho mỗi message (blocking, chạy mãi).

    - ``prefetch_count=1``: mỗi lúc chỉ giao 1 message chưa ack cho consumer này.
    - ack sau khi ``handler`` chạy xong; handler raise -> nack + requeue (không mất việc).
    - payload sai JSON -> nack, không requeue (tránh loop vô hạn message hỏng).
    """
    connection = pika.BlockingConnection(_connection_params())
    channel = connection.channel()
    channel.queue_declare(queue=queue, durable=True)
    channel.basic_qos(prefetch_count=1)

    def _on_message(ch, method, _properties, body) -> None:
        try:
            message = json.loads(body)
        except json.JSONDecodeError:
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            return
        try:
            handler(message)
        except Exception:
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
            raise
        else:
            ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_consume(queue=queue, on_message_callback=_on_message)
    channel.start_consuming()
