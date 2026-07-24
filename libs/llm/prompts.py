"""Prompt templates tái dùng cho cv-agent và ats-agent.

Mỗi hàm trả về `(system, prompt)` để truyền thẳng vào `LLMClient.complete`.
"""

from typing import Optional

# ---- CV generation (cv-agent, RAG) ----
CV_SYSTEM = (
    "Bạn là trợ lý viết CV chuyên nghiệp. Dựa trên hồ sơ ứng viên và mô tả "
    "công việc, sinh nội dung CV ở dạng JSON đúng schema gồm các khóa: "
    "summary, experience, education, skills. Chỉ trả về JSON, không giải thích."
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
            "\n## Phản hồi từ lần chấm điểm trước (cần cải thiện)",
            feedback,
        ]
    parts.append("\nHãy sinh cv_json phù hợp nhất với JD.")
    return CV_SYSTEM, "\n".join(parts)


# ---- ATS scoring (ats-agent) ----
ATS_SYSTEM = (
    "Bạn là hệ thống ATS. Chấm CV so với JD trên thang 0-100, phân tích "
    "score_breakdown (keywords/skills/experience/formatting), liệt kê "
    "matched/missing keywords và recommendations. Trả về JSON."
)


def ats_scoring(cv_json: str, job_description: str) -> tuple[str, str]:
    """Prompt chấm điểm CV so với JD."""
    prompt = (
        "## CV (JSON)\n"
        f"{cv_json}\n\n"
        "## Mô tả công việc (JD)\n"
        f"{job_description}\n\n"
        "Hãy chấm điểm và trả về JSON theo cấu trúc ATSReport."
    )
    return ATS_SYSTEM, prompt


# ---- Cover letter (ats-agent) ----
COVER_LETTER_SYSTEM = (
    "Bạn là chuyên gia viết cover letter. Viết thư xin việc ngắn gọn, "
    "chuyên nghiệp, bám sát JD và điểm mạnh trong CV. Trả về văn bản thuần."
)


def cover_letter(cv_json: str, job_description: str) -> tuple[str, str]:
    """Prompt viết cover letter cho CV + JD."""
    prompt = (
        "## CV (JSON)\n"
        f"{cv_json}\n\n"
        "## Mô tả công việc (JD)\n"
        f"{job_description}\n\n"
        "Hãy viết cover letter phù hợp."
    )
    return COVER_LETTER_SYSTEM, prompt
