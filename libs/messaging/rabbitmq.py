"""Wrapper RabbitMQ dùng chung: publish / consume message JSON.

TODO: cài đặt kết nối thực tế bằng pika hoặc aio-pika.
"""

# Tên các queue dùng chung trong hệ thống
QUEUE_JOBS_SCRAPED = "jobs.scraped"  # scraper -> cv-agent
QUEUE_CV_GENERATED = "cv.generated"  # cv-agent -> ats-agent


# def publish(queue: str, message: dict) -> None:
#     """Đẩy một message (dict) vào queue."""
#     payload = json.dumps(message)
#     # TODO: kết nối pika, channel.basic_publish(routing_key=queue, body=payload)
#     raise NotImplementedError


# def consume(queue: str, handler: Callable[[dict], None]) -> None:
#     """Lắng nghe queue, gọi handler cho mỗi message."""
#     # TODO: channel.basic_consume(queue, on_message_callback=...)
#     raise NotImplementedError
