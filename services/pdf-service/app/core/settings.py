"""Cấu hình cục bộ pdf-service."""

from pathlib import Path

# Thư mục chứa template LaTeX (.tex.j2)
TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"

# Timeout compile LaTeX (giây) — chống treo vô hạn.
COMPILE_TIMEOUT_SEC = 30
