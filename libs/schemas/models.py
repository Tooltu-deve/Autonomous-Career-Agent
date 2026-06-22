"""Pydantic models dùng chung giữa các service."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class Job(BaseModel):
    """Một job cào được từ LinkedIn/Indeed."""
    id: Optional[str] = None
    source: str                      # "linkedin" | "indeed"
    title: str
    company: str
    location: Optional[str] = None
    description: str                 # job description (JD)
    url: Optional[str] = None
    scraped_at: Optional[datetime] = None


class ProfileData(BaseModel):
    """User data dạng JSON dùng để sinh CV."""
    user_id: str
    full_name: str
    email: str
    summary: Optional[str] = None
    skills: list[str] = []
    experience: list[dict] = []
    education: list[dict] = []
    projects: list[dict] = []


class GeneratedCV(BaseModel):
    """CV do Agent 1 (RAG) sinh ra cho một job cụ thể."""
    user_id: str
    job_id: str
    content: dict                    # CV có cấu trúc (JSON)


class ATSReport(BaseModel):
    """Kết quả đánh giá của Agent 2 (ATS Audit)."""
    user_id: str
    job_id: str
    score: float                     # 0-100
    strengths: list[str] = []
    weaknesses: list[str] = []
    advice: list[str] = []
    cover_letter: Optional[str] = None
    pdf_path: Optional[str] = None
