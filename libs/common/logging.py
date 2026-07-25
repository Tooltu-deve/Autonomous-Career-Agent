"""Logging dùng chung: định dạng nhất quán cho mọi service."""

import logging

from libs.common.config import settings

_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_configured = False


def get_logger(name: str) -> logging.Logger:
    """Trả về logger đã cấu hình theo settings.log_level (cấu hình 1 lần)."""
    global _configured
    if not _configured:
        logging.basicConfig(level=settings.log_level, format=_FORMAT)
        _configured = True
    return logging.getLogger(name)
