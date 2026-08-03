"""LatexCompiler: chuỗi .tex → bytes PDF, dùng Tectonic (subprocess).

Bảo mật/độ bền (spec §3.1):
- Chạy trong thư mục TẠM riêng, dọn sau khi xong (stateless, không lưu file).
- Tectonic MẶC ĐỊNH tắt shell-escape (không truyền `-Z shell-escape`) → chống
  chạy lệnh tùy ý từ .tex.
- Timeout ~30s chống treo; treo/lỗi → raise CompileError (route map → 422).
"""

import logging
import subprocess
import tempfile
from pathlib import Path

from app.core.settings import COMPILE_TIMEOUT_SEC

logger = logging.getLogger(__name__)


class CompileError(Exception):
    """Compile LaTeX thất bại hoặc treo (→ 422)."""


def compile_pdf(tex_source: str) -> bytes:
    """Compile `tex_source` → bytes PDF. Raise CompileError nếu lỗi/treo."""
    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        tex_file = tmp_dir / "cv.tex"
        tex_file.write_text(tex_source, encoding="utf-8")

        try:
            result = subprocess.run(
                # Tectonic MẶC ĐỊNH tắt shell-escape (chỉ bật khi truyền
                # `-Z shell-escape`) — nên KHÔNG truyền flag đó = an toàn.
                [
                    "tectonic",
                    "--outdir",
                    str(tmp_dir),
                    str(tex_file),
                ],
                capture_output=True,
                timeout=COMPILE_TIMEOUT_SEC,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            logger.warning("Tectonic timeout sau %ss", COMPILE_TIMEOUT_SEC)
            raise CompileError("Compile LaTeX quá thời gian") from exc
        except FileNotFoundError as exc:  # tectonic chưa cài
            raise CompileError("Tectonic không khả dụng") from exc

        if result.returncode != 0:
            # Log rút gọn stderr (không đổ nguyên khối log lỗi LaTeX dài)
            tail = result.stderr.decode("utf-8", "replace")[-500:]
            logger.warning("Tectonic lỗi (rc=%s): %s", result.returncode, tail)
            raise CompileError("Compile LaTeX thất bại")

        pdf_file = tmp_dir / "cv.pdf"
        if not pdf_file.exists():
            raise CompileError("Không sinh được file PDF")
        return pdf_file.read_bytes()
    # TemporaryDirectory tự dọn thư mục tạm khi ra khỏi `with`.
