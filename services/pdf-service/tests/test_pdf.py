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


# ---- Contact links: \href + chuẩn hoá URL ----


def test_contact_urls_become_clickable_links():
    """github/linkedin phải là \\href để bấm được trong PDF, ở cả 3 template.

    Chữ hiển thị là "GitHub"/"LinkedIn", không phải URL trần.
    """
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV, HEADER)
        assert "\\href{https://github.com/nva}" in tex, tpl
        assert "\\href{https://linkedin.com/in/nva}" in tex, tpl


def test_link_text_is_the_site_name_not_the_url():
    """CV hiển thị "GitHub"/"LinkedIn" chứ không in URL trần ra trang."""
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV, HEADER)
        # URL chỉ xuất hiện trong target của \href, không nằm ở phần hiển thị
        assert tex.count("github.com/nva") == 1, tpl
        assert tex.count("linkedin.com/in/nva") == 1, tpl
        assert "{GitHub}" in tex or "{\\textbf{GitHub}}" in tex, tpl
        assert "{LinkedIn}" in tex or "{\\textbf{LinkedIn}}" in tex, tpl


def test_href_target_keeps_underscore_intact():
    """Target của \\href KHÔNG được escape kiểu LaTeX.

    escape_tex biến `_` thành `\\_`, làm hỏng URL — mà `_` rất phổ biến trong
    username GitHub/LinkedIn.
    """
    hdr = {
        **HEADER,
        "github_url": "github.com/thomas_tu",
        "linkedin_url": "linkedin.com/in/thomas_tu_07",
    }
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV, hdr)
        assert "\\href{https://github.com/thomas_tu}" in tex, tpl
        assert "\\href{https://linkedin.com/in/thomas_tu_07}" in tex, tpl


def test_href_target_gets_https_prefix():
    """Thiếu scheme thì \\href trỏ đường dẫn tương đối và không mở được."""
    hdr = {**HEADER, "github_url": "www.github.com/nva"}
    tex = renderer.render("classic", CV, hdr)
    assert "\\href{https://www.github.com/nva}" in tex
    # scheme sẵn có thì giữ nguyên, không thêm lần nữa
    hdr2 = {**HEADER, "github_url": "http://github.com/nva"}
    assert "\\href{http://github.com/nva}" in renderer.render("classic", CV, hdr2)


def test_href_target_does_not_double_encode():
    """URL đã percent-encode (vd tên tiếng Việt) phải giữ nguyên."""
    hdr = {**HEADER, "linkedin_url": "linkedin.com/in/nguy%E1%BB%85n-van-a"}
    tex = renderer.render("classic", CV, hdr)
    # `%` escape kiểu LaTeX -> hyperref trả lại `%` gốc, không encode lần hai
    assert "\\href{https://linkedin.com/in/nguy\\%E1\\%BB\\%85n-van-a}" in tex
    assert "%25E1" not in tex


def test_percent_in_url_is_latex_escaped():
    """`%` là ký tự comment của LaTeX -> phải escape, percent-encode KHÔNG cứu được
    vì `%25` cũng bắt đầu bằng `%` và vẫn bị nuốt lúc tokenize."""
    hdr = {**HEADER, "github_url": "github.com/100%pass"}
    tex = renderer.render("classic", CV, hdr)
    assert "\\href{https://github.com/100\\%pass}" in tex


def test_no_dangling_label_when_only_one_contact_link():
    """Chỉ điền 1 trong 2 -> không được in nhãn của cái còn lại rồi bỏ trống."""
    only_github = {**HEADER, "linkedin_url": None}
    for tpl in ("classic", "academic"):
        tex = renderer.render(tpl, CV, only_github)
        assert "LinkedIn" not in tex, tpl
        assert "GitHub" in tex, tpl

    only_linkedin = {**HEADER, "github_url": None}
    for tpl in ("classic", "academic"):
        tex = renderer.render(tpl, CV, only_linkedin)
        assert "GitHub" not in tex, tpl
        assert "LinkedIn" in tex, tpl


def test_no_dangling_label_when_only_one_of_email_phone():
    """Cùng lỗi ở dòng Email/Phone — user không có phone rất phổ biến."""
    for tpl in ("classic", "academic"):
        tex = renderer.render(tpl, CV, {**HEADER, "phone": None})
        assert "Phone" not in tex, tpl
        assert "Email" in tex, tpl


def test_link_label_follows_the_host():
    """Field trên UI là "GitHub / Portfolio" nên nhãn phải theo nội dung."""
    assert renderer.link_label("github.com/nva") == "GitHub"
    assert renderer.link_label("https://www.github.com/nva/") == "GitHub"
    assert renderer.link_label("GitHub.com/NVA") == "GitHub"
    assert renderer.link_label("thomastu.dev") == "Portfolio"
    assert renderer.link_label("https://my-site.vercel.app/cv") == "Portfolio"
    # github.io là trang cá nhân, chỉ tình cờ host trên GitHub Pages
    assert renderer.link_label("nva.github.io") == "Portfolio"
    assert renderer.link_label("") == ""
    assert renderer.link_label(None) == ""


def test_portfolio_link_is_labelled_portfolio_not_github():
    """Regression: trước đây nhãn cứng "GitHub" nên link portfolio bị ghi sai."""
    hdr = {**HEADER, "github_url": "thomastu.dev"}
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV, hdr)
        assert "Portfolio" in tex, tpl
        assert "GitHub" not in tex, tpl
        assert "\\href{https://thomastu.dev}" in tex, tpl


def test_github_link_still_labelled_github():
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV, {**HEADER, "github_url": "github.com/nva"})
        assert "GitHub" in tex, tpl
        assert "Portfolio" not in tex, tpl
