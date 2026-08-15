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
    """Cả 3 template phải render title + obtain_date (định dạng "May 2024") của
    mỗi chứng chỉ.

    Cập nhật theo Task 5 (định dạng ngày cấp chứng chỉ): trước đây assert chuỗi
    ISO thô `2024-05-20`, nay template in "May 2024" nên assertion phải theo
    đúng output mới, không còn kiểm tra chuỗi ISO.
    """
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV_WITH_CERTS, HEADER)
        assert "AWS Certified Developer" in tex, tpl
        assert "May 2024" in tex, tpl
        assert "Azure Fundamentals" in tex, tpl
        assert "November 2023" in tex, tpl


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


# ---- Định dạng ngày cấp chứng chỉ ----


def test_month_year_formats_date_and_iso_string():
    """Nhận cả `date` (đường ORM) lẫn chuỗi ISO (đường JSON API)."""
    from datetime import date

    assert renderer.month_year(date(2024, 5, 1)) == "May 2024"
    assert renderer.month_year("2024-05-01") == "May 2024"
    assert renderer.month_year("2019-12-01") == "December 2019"


def test_month_year_returns_empty_for_unusable_input():
    """Giá trị rỗng/rác -> chuỗi rỗng để template bỏ qua thay vì in rác."""
    assert renderer.month_year("") == ""
    assert renderer.month_year(None) == ""
    assert renderer.month_year("khong-phai-ngay") == ""


def test_certifications_render_as_month_year_not_iso():
    """CV in "May 2024", không in ngày ISO — ngày 01 chỉ là giá trị kỹ thuật."""
    cv = {
        **CV,
        "certifications": [
            {"title": "AWS Certified Developer", "obtain_date": "2024-05-01"}
        ],
    }
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, cv, HEADER)
        assert "May 2024" in tex, tpl
        assert "2024-05-01" not in tex, tpl


# ---- CV in đủ dữ liệu experience/education (trước đây UI không nhập được) ----

CV_FULL = {
    "summary": "Backend engineer.",
    "experience": [
        {
            "title": "Backend Developer",
            "organization": "ACME Corp",
            "start_date": "2022-01-01",
            "end_date": None,
            "description": "Built APIs",
        },
        {
            "title": "Intern",
            "organization": "VNG",
            "start_date": "2020-06-01",
            "end_date": "2021-12-01",
            "description": None,
        },
    ],
    "education": [
        {
            "school": "HCMUS",
            "degree": "BSc",
            "field_of_study": "Computer Science",
            "start_date": "2019-09-01",
            "end_date": "2023-06-01",
            "description": None,
        }
    ],
    "certifications": [],
    "skills": ["python"],
}


def test_cv_renders_real_organization_not_placeholder():
    """Tên tổ chức phải là giá trị thật, không phải 'Personal Project'."""
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV_FULL, HEADER)
        assert "ACME Corp" in tex, tpl
        assert "VNG" in tex, tpl
        assert "Personal Project" not in tex, tpl


def test_cv_renders_experience_date_range():
    """start_date có giá trị -> khối `if` chạy, và in dạng người đọc được."""
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV_FULL, HEADER)
        assert "January 2022" in tex, tpl
        assert "June 2020" in tex, tpl
        assert "December 2021" in tex, tpl


def test_cv_never_prints_iso_dates():
    """Ngày ISO là định dạng lưu trữ, không bao giờ được lọt lên CV."""
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV_FULL, HEADER)
        for iso in ("2022-01-01", "2020-06-01", "2021-12-01", "2019-09-01"):
            assert iso not in tex, f"{tpl}: {iso}"


def test_cv_renders_present_for_current_job():
    """end_date null -> CV in 'Present', không phải chuỗi rỗng.

    Hồi quy: filter monthyear trả "" cho giá trị không parse được, nên phải
    lấy monthyear TRƯỚC rồi mới `or "Present"` — làm ngược lại sẽ nuốt mất chữ.
    """
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV_FULL, HEADER)
        assert "January 2022 -- Present" in tex, tpl


def test_cv_renders_education_dates_and_field_of_study():
    for tpl in ("classic", "modern", "academic"):
        tex = renderer.render(tpl, CV_FULL, HEADER)
        assert "Computer Science" in tex, tpl
        assert "September 2019 -- June 2023" in tex, tpl


def test_cv_omits_date_range_when_start_date_missing():
    """Ngày không bắt buộc: thiếu start_date thì bỏ khoảng thời gian, không in rác."""
    cv = {
        **CV_FULL,
        "experience": [
            {
                "title": "Volunteer",
                "organization": "Local NGO",
                "start_date": None,
                "end_date": None,
                "description": None,
            }
        ],
    }
    tex = renderer.render("classic", cv, HEADER)
    assert "Local NGO" in tex
    assert "Present" not in tex


def test_cv_omits_date_range_when_start_date_unparseable():
    """Dữ liệu rác không được biến thành gạch ngang trơ trọi hay 'Present'.

    Khối `if` xét giá trị SAU khi định dạng, nên start_date không parse được
    thì cả khoảng thời gian biến mất thay vì in "-- Present".
    """
    cv = {
        **CV_FULL,
        "experience": [
            {
                "title": "Volunteer",
                "organization": "Local NGO",
                "start_date": "sometime in 2019",
                "end_date": None,
                "description": None,
            }
        ],
    }
    tex = renderer.render("classic", cv, HEADER)
    assert "Local NGO" in tex
    assert "sometime in 2019" not in tex
    assert "Present" not in tex


# ---- Bullet descriptions (SCRUM-75) ----
CV_WITH_BULLETS = {
    **CV,
    "experience": [
        {
            "title": "Backend Developer",
            "organization": "ACME",
            "description": [
                "Built REST APIs serving 10k users",
                "Cut response time by 40%",
                "Led a team of 3 engineers",
            ],
        }
    ],
    "education": [{"school": "HCMUS", "degree": "BSc", "description": ["GPA 3.6/4.0"]}],
}


def _description_items(tex: str, section: str) -> int:
    """Đếm \\item thuộc phần mô tả, bỏ qua \\item của mục Skills."""
    body = tex.split(section, 1)[1] if section in tex else tex
    stop = body.find("Skills")
    return body[: stop if stop > 0 else len(body)].count(r"\item")


@pytest.mark.parametrize("tpl", ["classic", "modern", "academic"])
def test_render_description_as_bullet_list(tpl):
    """Mỗi dòng mô tả thành một \\item riêng, bọc trong itemize."""
    tex = renderer.render(tpl, CV_WITH_BULLETS, HEADER)
    assert r"\begin{itemize}" in tex
    for line in ("Built REST APIs serving 10k users", "Led a team of 3 engineers"):
        assert rf"\item {line}" in tex.replace(r"\%", "%"), tpl


@pytest.mark.parametrize("tpl", ["classic", "modern", "academic"])
def test_render_accepts_legacy_string_description(tpl):
    """cv_json cũ (chuỗi "- A\\n- B") vẫn render đúng 2 bullet, không lặp ký tự."""
    legacy = {
        **CV,
        "experience": [
            {
                "title": "Dev",
                "organization": "ACME",
                "description": "- Built REST APIs\n- Cut latency by 40%",
            }
        ],
        "education": [],
    }
    tex = renderer.render(tpl, legacy, HEADER)
    assert r"\item Built REST APIs" in tex
    assert r"\item Cut latency by 40\%" in tex
    # nếu Jinja lặp trên chuỗi thì sẽ có hàng chục \item một ký tự
    assert tex.count(r"\item") < 6, f"{tpl}: có vẻ đang lặp theo ký tự"


@pytest.mark.parametrize("desc", [[], None, ""])
def test_render_omits_itemize_when_description_empty(desc):
    """Không có mô tả -> không sinh itemize rỗng (LaTeX lỗi nếu itemize không item)."""
    cv = {
        **CV,
        "experience": [{"title": "D", "organization": "A", "description": desc}],
        "education": [],
    }
    tex = renderer.render("classic", cv, HEADER)
    assert _description_items(tex, "Work Experience") == 0


# Các giá trị TRUTHY nhưng lọc xong không còn bullet nào. `if description` trần
# sẽ mở itemize rồi không sinh \item -> LaTeX báo "perhaps a missing \item".
BLANK_DESCRIPTIONS = [[""], ["   "], ["", ""], "\n", "-", "  \n  "]


@pytest.mark.parametrize("tpl", ["classic", "modern", "academic"])
@pytest.mark.parametrize("desc", BLANK_DESCRIPTIONS)
def test_render_never_emits_empty_itemize(tpl, desc):
    """Mô tả chỉ chứa khoảng trắng/dấu gạch -> KHÔNG mở itemize."""
    cv = {
        **CV,
        "experience": [{"title": "D", "organization": "A", "description": desc}],
        "education": [{"school": "HCMUS", "description": desc}],
        "certifications": [],
        "skills": [],
    }
    tex = renderer.render(tpl, cv, HEADER)
    # Không có bullet nào -> cũng không được có \begin{itemize} nào (skills đã bỏ trống)
    assert (
        tex.count(r"\begin{itemize}") == 0
    ), f"{tpl}: mở itemize rỗng với description={desc!r}"


def test_bullet_lines_are_latex_escaped():
    """Ký tự đặc biệt trong từng bullet vẫn được escape."""
    cv = {
        **CV,
        "experience": [
            {
                "title": "D",
                "organization": "A",
                "description": ["Cut cost by 40% & $5k", "C++ _perf_ {test}"],
            }
        ],
        "education": [],
    }
    tex = renderer.render("classic", cv, HEADER)
    assert r"40\%" in tex and r"\&" in tex and r"\$" in tex
    assert r"\_" in tex and r"\{" in tex
