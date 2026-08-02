"""Schema parse output LLM khi chấm điểm — phần ATSReport TRỪ cover letter.

Cover letter là lần gọi LLM riêng (trả text thuần), model_used lấy từ settings;
hai field đó ghép vào ATSReport ở tầng orchestrator.
"""

from pydantic import BaseModel, Field

from libs.schemas.models import Recommendation


class ScoringOutput(BaseModel):
    """Kết quả chấm điểm LLM trả về (JSON)."""

    overall_score: int = Field(ge=0, le=100)
    score_breakdown: dict
    matched_keywords: list[str] = []
    missing_keywords: list[str] = []
    recommendations: list[Recommendation] = []
