"""Prompt templates tái dùng cho cv-agent và ats-agent.

Mỗi hàm trả về `(system, prompt)` để truyền thẳng vào `LLMClient.complete`.
"""

from typing import Optional

# ---- CV generation (cv-agent, RAG) ----
# ---- CV generation (cv-agent) ----
# ---- CV generation (cv-agent) ----
CV_SYSTEM = (
    "Bạn là chuyên gia viết CV. Nhiệm vụ: từ hồ sơ ứng viên và mô tả công việc "
    "(JD), viết nội dung CV nhắm đúng JD đó. QUY TẮC BẤT DI BẤT DỊCH: chỉ dùng "
    "thông tin có thật trong hồ sơ — không bịa kinh nghiệm, kỹ năng, bằng cấp "
    "hay số liệu không có trong hồ sơ. TOÀN BỘ nội dung CV phải viết bằng "
    "TIẾNG ANH — kể cả khi hồ sơ hay JD viết bằng ngôn ngữ khác thì dịch thông "
    "tin thật sang tiếng Anh (không bịa thêm khi dịch). Chỉ trả về MỘT JSON "
    "object phẳng, không markdown, không giải thích."
)


def cv_generation(
    profile_json: str, job_description: str, feedback: Optional[str] = None
) -> tuple[str, str]:
    """Prompt sinh CV; kèm `feedback` khi là lần retry."""
    parts = [
        "## Hồ sơ ứng viên (JSON)",
        profile_json,
        "\n## Mô tả công việc (JD)",
        job_description,
    ]
    if feedback:
        parts += [
            "\n## Phản hồi từ lần chấm điểm ATS trước — ƯU TIÊN khắc phục các điểm này",
            feedback,
        ]
    parts += [
        "\n## Yêu cầu nội dung",
        "- summary: 3-4 câu, nêu số năm kinh nghiệm + thế mạnh khớp nhất với JD.",
        "- description của mỗi kinh nghiệm: 2-4 gạch đầu dòng (phân cách bằng "
        "'\\n- '), mở đầu bằng động từ hành động, ưu tiên thành quả đo đếm được.",
        "- Dùng từ khóa xuất hiện trong JD ở mọi chỗ hợp lệ (chỉ khi hồ sơ thật "
        "sự có kinh nghiệm đó).",
        "- skills: sắp kỹ năng khớp JD lên đầu.",
        "- Viết TOÀN BỘ nội dung bằng TIẾNG ANH, bất kể ngôn ngữ của JD hay hồ sơ.",
        "- Ngày tháng định dạng ISO YYYY-MM-DD; end_date là null nếu đang làm.",
        "- certifications: chép nguyên từ hồ sơ, KHÔNG bịa thêm; bỏ trống nếu hồ "
        "sơ không có. Mỗi mục cần title và obtain_date (ISO YYYY-MM-DD).",
        "\nTrả về JSON đúng theo mẫu sau (thay giá trị):",
        "{\n"
        '  "summary": "Backend engineer with 3 years of experience...",\n'
        '  "experience": [{"title": "Backend Developer", "organization": "ACME",\n'
        '    "start_date": "2023-01-01", "end_date": null,\n'
        '    "description": "- Built REST APIs serving 10k users'
        '\\n- Cut response time by 40%"}],\n'
        '  "education": [{"school": "HCMUS", "degree": "BSc",\n'
        '    "field_of_study": "Computer Science", "start_date": "2019-09-01",\n'
        '    "end_date": "2023-06-01", "description": null}],\n'
        '  "certifications": [{"title": "AWS Certified Developer",\n'
        '    "obtain_date": "2024-05-20"}],\n'
        '  "skills": ["python", "fastapi", "postgresql"]\n'
        "}",
    ]
    return CV_SYSTEM, "\n".join(parts)


# ---- ATS scoring (ats-agent) ----
ATS_SYSTEM = (
    "Bạn là hệ thống ATS. Chấm CV so với JD trên thang 0-100. "
    "Chỉ trả về MỘT JSON object phẳng (không bọc trong key khác, không markdown, "
    "không giải thích) với đúng các khóa: overall_score (int 0-100), "
    "score_breakdown (object với các khóa keywords/skills/experience/formatting, "
    "giá trị int 0-100), matched_keywords (mảng string), missing_keywords "
    "(mảng string), recommendations (mảng object dạng {type, title, body}). "
    "Mọi nội dung text trong recommendations phải viết bằng TIẾNG ANH, "
    "bất kể ngôn ngữ của CV hay JD."
)


def ats_scoring(cv_json: str, job_description: str) -> tuple[str, str]:
    """Prompt chấm điểm CV so với JD."""
    prompt = (
        "## CV (JSON)\n"
        f"{cv_json}\n\n"
        "## Mô tả công việc (JD)\n"
        f"{job_description}\n\n"
        "Hãy chấm điểm và trả về JSON đúng theo mẫu sau (thay giá trị):\n"
        "{\n"
        '  "overall_score": 82,\n'
        '  "score_breakdown": {"keywords": 70, "skills": 80, '
        '"experience": 90, "formatting": 85},\n'
        '  "matched_keywords": ["python", "fastapi"],\n'
        '  "missing_keywords": ["kubernetes"],\n'
        '  "recommendations": [{"type": "add", "title": "CI/CD", '
        '"body": "Add a CI/CD section to your experience"}]\n'
        "}"
    )
    return ATS_SYSTEM, prompt


# ---- Cover letter (ats-agent) ----
# ---- Cover letter (ats-agent) ----
COVER_LETTER_SYSTEM = (
    "Bạn là chuyên gia viết thư xin việc. Thư PHẢI viết bằng TIẾNG ANH (gửi kèm "
    "CV tiếng Anh cho nhà tuyển dụng), bất kể ngôn ngữ của JD. Chỉ trả về VĂN "
    "BẢN THUẦN của lá thư — không JSON, không markdown, không tiêu đề trang, "
    "không thông tin liên hệ bịa, không placeholder kiểu [Company Name]. Chỉ "
    "dùng thông tin có thật trong CV và JD."
)


def cover_letter(cv_json: str, job_description: str) -> tuple[str, str]:
    """Prompt viết cover letter cho CV + JD."""
    prompt = (
        "## CV (JSON)\n"
        f"{cv_json}\n\n"
        "## Mô tả công việc (JD)\n"
        f"{job_description}\n\n"
        "Viết cover letter 250-350 từ BẰNG TIẾNG ANH (bất kể ngôn ngữ của JD), "
        "cấu trúc 3 đoạn:\n"
        "1. Mở: nêu vị trí ứng tuyển (đúng tên trong JD) + 1 câu hook về điểm "
        "mạnh phù hợp nhất.\n"
        "2. Thân: chọn 2-3 yêu cầu quan trọng nhất của JD, với mỗi yêu cầu dẫn "
        "chứng cụ thể từ CV chứng minh đáp ứng được.\n"
        "3. Kết: thể hiện mong muốn trao đổi thêm, giọng tự tin, không van nài.\n"
        "Bắt đầu bằng 'Dear Hiring Manager,' và kết bằng tên ứng viên nếu có "
        "trong CV."
    )
    return COVER_LETTER_SYSTEM, prompt
