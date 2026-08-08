"""Test pdf-service — render + route. Mock compile (Tectonic không có khi test).

Kiểm: template ngoài whitelist → 422; render escape ký tự LaTeX; compile OK →
trả application/pdf; compile lỗi → 422; thiếu field → 422.
"""

import pytest
from app.main import app
from app.services import compiler, renderer
from fastapi.testclient import TestClient

client = TestClient(app)

CV = {
    "summary": "Backend engineer with 3 years exp",
    "experience": [
        {"title": "Dev", "organization": "ACME", "description": "Built APIs"}
    ],
    "education": [{"school": "HCMUS", "degree": "BSc"}],
    "skills": ["python", "fastapi"],
}

HEADER = {
    "full_name": "Nguyen Van A",
    "email": "a@example.com",
    "phone": "+84 900 000 000",
    "headline": "Backend Engineer",
    "location": "Ho Chi Minh City",
    "github_url": "github.com/nva",
    "linkedin_url": "linkedin.com/in/nva",
}


@pytest.fixture(autouse=True)
def mock_compile(monkeypatch):
    """Mặc định: compile trả bytes PDF giả (không gọi Tectonic thật)."""
    monkeypatch.setattr(compiler, "compile_pdf", lambda tex: b"%PDF-1.5 fake")


# ---- Route ----
def test_export_returns_pdf(client=client):
    r = client.post("/pdf/export", json={"template": "modern", "cv_data": CV})
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content.startswith(b"%PDF")


def test_bad_template_422():
    r = client.post("/pdf/export", json={"template": "fancy", "cv_data": CV})
    assert r.status_code == 422  # Literal whitelist chặn


def test_missing_cv_data_422():
    r = client.post("/pdf/export", json={"template": "classic"})
    assert r.status_code == 422


def test_invalid_cv_data_422():
    # cv_data có mặt nhưng sai schema (thiếu summary) -> 422, không phải 500
    bad = {"experience": [], "education": [], "skills": []}
    r = client.post("/pdf/export", json={"template": "classic", "cv_data": bad})
    assert r.status_code == 422


def test_compile_error_422(monkeypatch):
    def _boom(tex):
        raise compiler.CompileError("LaTeX hỏng")

    monkeypatch.setattr(compiler, "compile_pdf", _boom)
    r = client.post("/pdf/export", json={"template": "academic", "cv_data": CV})
    assert r.status_code == 422


# ---- Renderer: escape LaTeX (bảo mật) ----
@pytest.mark.parametrize("tpl", ["classic", "modern", "academic"])
def test_render_escapes_latex_special_chars(tpl):
    danger = {
        "summary": r"100% & $5 #1 _x {y} ~z ^w \evil",
        "experience": [],
        "education": [],
        "skills": [],
    }
    tex = renderer.render(tpl, danger)
    # ký tự đặc biệt phải bị escape, KHÔNG còn nguyên bản gây injection
    assert r"\%" in tex and r"\&" in tex and r"\$" in tex and r"\#" in tex
    assert r"\_" in tex and r"\{" in tex and r"\}" in tex
    assert r"\textbackslash{}" in tex  # \evil -> escape, không chạy \evil
    # không còn "100%" thô (đã thành 100\%)
    assert "100%" not in tex.replace(r"\%", "")


def test_render_all_three_templates():
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV, HEADER)
        assert r"\begin{document}" in tex
        assert "Backend engineer" in tex  # summary vào đúng


def test_render_includes_header_fields():
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV, HEADER)
        assert "Nguyen Van A" in tex  # full_name
        assert "a@example.com" in tex  # email
        assert "github.com/nva" in tex  # github_url
        assert "linkedin.com/in/nva" in tex  # linkedin_url


def test_render_ok_without_header():
    # header rỗng -> template bỏ phần header, không lỗi
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV, {})
        assert r"\begin{document}" in tex
        assert "Backend engineer" in tex


# ---- Certifications (SCRUM-66) ----
CV_WITH_CERTS = {
    **CV,
    "certifications": [
        {"title": "AWS Certified Developer", "obtain_date": "2024-05-20"},
        {"title": "Azure Fundamentals", "obtain_date": "2023-11-02"},
    ],
}


def test_render_includes_certifications_all_templates():
    """Cả 3 template phải render title + obtain_date của mỗi chứng chỉ."""
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV_WITH_CERTS, HEADER)
        assert "AWS Certified Developer" in tex, tpl
        assert "2024-05-20" in tex, tpl
        assert "Azure Fundamentals" in tex, tpl


def test_render_omits_certifications_section_when_empty():
    """Không có chứng chỉ -> không in ra tiêu đề mục Certifications rỗng.

    Bỏ qua dòng comment LaTeX (`%`) vì chúng không hiện trong PDF.
    """
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, {**CV, "certifications": []}, HEADER)
        visible = [ln for ln in tex.splitlines() if not ln.lstrip().startswith("%")]
        assert not any("ertification" in ln.lower() for ln in visible), tpl


def test_certification_missing_obtain_date_422():
    """`obtain_date` bắt buộc (API_CONTRACT §A2) -> thiếu là 422."""
    bad = {**CV, "certifications": [{"title": "No date"}]}
    r = client.post(
        "/pdf/export", json={"template": "classic", "cv_data": bad, "header": HEADER}
    )
    assert r.status_code == 422


def test_certification_escapes_latex_special_chars():
    """Tên chứng chỉ có ký tự LaTeX đặc biệt phải được escape."""
    cv = {
        **CV,
        "certifications": [
            {"title": "C++ & 100% Pass_Rate", "obtain_date": "2024-01-01"}
        ],
    }
    tex = renderer.render("classic", cv, HEADER)
    assert "100\\%" in tex
    assert "\\&" in tex
