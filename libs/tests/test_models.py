"""Tests cho shared models — chú trọng gate validate của CVContent."""

import re
from pathlib import Path
from typing import get_args

import pytest
from pydantic import ValidationError

from libs.schemas.models import (
    SCHEMA_VERSION,
    ATSReport,
    CVContent,
    CvEditStatus,
    CvGenerated,
    CvRequest,
    GeneratedCV,
    GenerationStatus,
    Job,
    JobSource,
    JobStatus,
    PipelineStage,
    ProfileData,
    TemplateName,
)

_SCHEMA_SQL = (
    Path(__file__).resolve().parents[2] / "infra" / "init-db" / "01_schema.sql"
)


def _sql_enum_values(type_name: str) -> set[str]:
    """Trích danh sách value của một CREATE TYPE ... AS ENUM trong schema SQL."""
    sql = _SCHEMA_SQL.read_text(encoding="utf-8")
    match = re.search(rf"CREATE TYPE {type_name} AS ENUM\s*\((.*?)\)", sql, re.DOTALL)
    assert match, f"Không tìm thấy ENUM {type_name} trong {_SCHEMA_SQL}"
    return set(re.findall(r"'([^']+)'", match.group(1)))


def _valid_content() -> dict:
    return {
        "summary": "Kỹ sư phần mềm",
        "experience": [
            {"title": "Backend Dev", "organization": "Acme"},
        ],
        "education": [{"school": "HUST"}],
        "skills": ["python", "fastapi"],
    }


def test_generated_cv_accepts_valid_content():
    cv = GeneratedCV(
        application_id="app-1",
        content=_valid_content(),
        model_used="claude-opus-4-8",
    )
    assert cv.content.summary == "Kỹ sư phần mềm"
    assert cv.content.experience[0].organization == "Acme"
    assert cv.edit_status == "draft"  # mặc định


def test_generated_cv_rejects_bad_edit_status():
    with pytest.raises(ValidationError):
        GeneratedCV(
            application_id="app-1",
            content=_valid_content(),
            model_used="m",
            edit_status="published",  # ngoài whitelist draft|edited
        )


def test_cv_content_rejects_missing_summary():
    bad = _valid_content()
    del bad["summary"]
    with pytest.raises(ValidationError):
        CVContent(**bad)


def test_cv_content_rejects_wrong_type():
    bad = _valid_content()
    bad["skill_groups"] = "not-a-list"
    with pytest.raises(ValidationError):
        CVContent(**bad)


# ---- skill_groups: nhóm kỹ năng + tương thích ngược với cv_json cũ ----
# `GET /cvs/{id}` validate lại mọi bản ghi cũ qua CVContent, nên CV sinh trước
# khi có nhóm phải đọc được nguyên vẹn.


def test_cv_content_migrates_legacy_flat_skills():
    content = CVContent(**_valid_content())  # fixture vẫn dùng `skills` phẳng
    assert len(content.skill_groups) == 1
    assert content.skill_groups[0].category == "Skills"
    assert content.skill_groups[0].skills == ["python", "fastapi"]


def test_cv_content_accepts_skill_groups():
    data = _valid_content()
    del data["skills"]
    data["skill_groups"] = [
        {"category": "Cloud Platforms", "skills": ["AWS EC2"]},
        {"category": "Core Programming", "skills": ["Python", "SQL"]},
    ]
    content = CVContent(**data)
    assert [g.category for g in content.skill_groups] == [
        "Cloud Platforms",
        "Core Programming",
    ]
    assert content.skill_groups[1].skills == ["Python", "SQL"]


def test_cv_content_prefers_skill_groups_over_legacy_skills():
    data = _valid_content()  # có sẵn `skills` phẳng
    data["skill_groups"] = [{"category": "Cloud", "skills": ["AWS"]}]
    content = CVContent(**data)
    assert len(content.skill_groups) == 1
    assert content.skill_groups[0].skills == ["AWS"]


def test_cv_content_legacy_empty_skills_gives_no_groups():
    data = _valid_content()
    data["skills"] = []
    assert CVContent(**data).skill_groups == []


def test_cv_content_legacy_junk_skills_does_not_crash():
    # Một bản ghi cũ hỏng không được làm 500 cả GET /cvs/{id}.
    for junk in ("python", [1, 2], None):
        data = _valid_content()
        data["skills"] = junk
        assert CVContent(**data).skill_groups == []


@pytest.mark.parametrize(
    "groups",
    [
        [{"skills": ["a"]}],  # thiếu category
        [{"category": 1, "skills": "a"}],  # sai kiểu
        ["Cloud Platforms"],  # chuỗi thay vì object
    ],
)
def test_cv_content_rejects_malformed_skill_groups(groups):
    data = _valid_content()
    data["skill_groups"] = groups
    with pytest.raises(ValidationError):
        CVContent(**data)


def test_job_rejects_source_outside_whitelist():
    with pytest.raises(ValidationError):
        Job(source="glassdoor", title="X", company="Y", description="Z")


def test_profile_rejects_template_outside_whitelist():
    with pytest.raises(ValidationError):
        ProfileData(
            user_id="u1",
            full_name="A",
            email="a@b.c",
            preferred_template="fancy",
        )


def test_profile_data_parses_typed_experience_education():
    profile = ProfileData(
        user_id="u1",
        full_name="A",
        email="a@b.c",
        experience=[{"title": "Dev", "organization": "Acme"}],
        education=[{"school": "HUST", "degree": "BSc"}],
    )
    # dict được parse thành model typed, không còn là dict thô.
    assert profile.experience[0].organization == "Acme"
    assert profile.education[0].degree == "BSc"


def test_profile_data_rejects_experience_missing_required_field():
    with pytest.raises(ValidationError):
        ProfileData(
            user_id="u1",
            full_name="A",
            email="a@b.c",
            experience=[{"organization": "Acme"}],  # thiếu title
        )


def test_cv_request_defaults():
    req = CvRequest(user_id="u1", job_id="j1")
    assert req.attempt == 1
    assert req.feedback is None


def test_messages_stamp_schema_version():
    # Mọi message qua queue phải mang schema_version (mặc định = SCHEMA_VERSION).
    assert CvRequest(user_id="u1", job_id="j1").schema_version == SCHEMA_VERSION
    assert CvGenerated(cv_generation_id="cvgen-1").schema_version == SCHEMA_VERSION
    # Xuất hiện trong payload publish (model_dump), khớp API_CONTRACT phần B.
    assert CvRequest(user_id="u1", job_id="j1").model_dump()["schema_version"] == 1


def test_cv_generated_message_carries_only_pointer():
    msg = CvGenerated(cv_generation_id="cvgen-1")
    assert msg.cv_generation_id == "cvgen-1"
    # message `cv.generated` chỉ là con trỏ, không mang nội dung CV.
    assert "content" not in CvGenerated.model_fields


@pytest.mark.parametrize(
    "literal, sql_type",
    [
        (JobSource, "job_source"),
        (JobStatus, "job_status"),
        (GenerationStatus, "generation_status"),
        (PipelineStage, "pipeline_stage"),
        (CvEditStatus, "cv_edit_status"),
    ],
)
def test_status_literals_match_sql_enum(literal, sql_type):
    """Tập giá trị Literal trong libs phải khớp đúng ENUM trong SQL (chống drift)."""
    assert set(get_args(literal)) == _sql_enum_values(sql_type)


def test_template_name_matches_profiles_check():
    """TemplateName khớp CHECK constraint của profiles.preferred_template."""
    sql = _SCHEMA_SQL.read_text(encoding="utf-8")
    match = re.search(r"preferred_template IN \(([^)]+)\)", sql)
    assert match
    assert set(get_args(TemplateName)) == set(re.findall(r"'([^']+)'", match.group(1)))


def test_ats_report_score_bounds():
    with pytest.raises(ValidationError):
        ATSReport(
            overall_score=150,
            score_breakdown={},
            cover_letter_text="hi",
            model_used="claude-opus-4-8",
        )
