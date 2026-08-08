r"""TemplateRenderer: cv_data + template.tex.j2 → chuỗi .tex (Jinja2).

Bảo mật (spec §3.1): escape TRIỆT ĐỂ ký tự đặc biệt LaTeX trong MỌI giá trị
user nhập, nếu không user có thể chèn lệnh LaTeX (\input, \write18...) hoặc phá vỡ
cú pháp. Escape được cài như một Jinja2 filter `tex`.
"""

from jinja2 import Environment, FileSystemLoader

from app.core.settings import TEMPLATE_DIR

# Ánh xạ ký tự đặc biệt LaTeX → chuỗi an toàn. Backslash phải xử lý trước
# (không thể chỉ replace vì \textbackslash lại chứa các ký tự khác).
_LATEX_ESCAPE = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}


def escape_tex(value: object) -> str:
    """Escape mọi ký tự đặc biệt LaTeX trong `value` (ép về str trước)."""
    text = str(value)
    out = []
    for ch in text:
        out.append(_LATEX_ESCAPE.get(ch, ch))
    return "".join(out)


# Ký tự phải percent-encode trong target của \href. KHÔNG dùng escape_tex ở đây:
# nó biến `_` thành `\_`, làm hỏng URL — mà `_` rất phổ biến trong username
# GitHub/LinkedIn. hyperref xử lý phần còn lại verbatim.
# `%` và `#` KHÔNG percent-encode được: LaTeX xử lý chúng ở tầng tokenize, trước
# khi hyperref nhìn thấy — `%` bắt đầu comment và nuốt hết phần còn lại của dòng,
# nên `%25` cũng hỏng y như `%`. Phải escape kiểu LaTeX; hyperref trả lại đúng ký
# tự gốc trong URL. Nhờ vậy URL đã encode sẵn (LinkedIn tên tiếng Việt:
# /in/nguy%E1%BB%85n-van-a) cũng giữ nguyên, không bị encode lần hai.
# Các ký tự còn lại percent-encode bình thường. `_` để nguyên — hyperref chấp
# nhận trong URL, và đây là ký tự phổ biến trong username GitHub/LinkedIn.
_URL_ESCAPE = {
    "%": r"\%",
    "#": r"\#",
    "\\": "%5C",
    "{": "%7B",
    "}": "%7D",
    " ": "%20",
}


def escape_tex_url(value: object) -> str:
    r"""Chuẩn hoá URL rồi làm an toàn để đặt vào `\href{...}`.

    Thêm `https://` khi user gõ thiếu scheme — `\href{www.github.com/x}{...}`
    bị PDF reader coi là đường dẫn tương đối và không mở được.
    Trả về chuỗi rỗng cho giá trị rỗng, để template biết mà bỏ qua.
    """
    text = str(value or "").strip()
    if not text:
        return ""
    if not text.lower().startswith(("http://", "https://")):
        text = f"https://{text}"
    out = []
    for ch in text:
        out.append(_URL_ESCAPE.get(ch, ch))
    return "".join(out)


def _host_of(url: str) -> str:
    """Lấy host, bỏ scheme và `www.`, hạ về chữ thường."""
    low = url.strip().lower()
    for scheme in ("https://", "http://"):
        if low.startswith(scheme):
            low = low[len(scheme) :]
            break
    host = low.split("/")[0]
    return host[4:] if host.startswith("www.") else host


def link_label(value: object) -> str:
    """Chữ hiển thị cho link ở header CV.

    Field trên UI là "GitHub / Portfolio" nên nhận cả link GitHub lẫn trang cá
    nhân; nhãn phải theo đúng nội dung, ghi "GitHub" cho một portfolio là sai.
    `username.github.io` tính là Portfolio — đó là trang cá nhân, chỉ tình cờ
    được host trên GitHub Pages.
    """
    text = str(value or "").strip()
    if not text:
        return ""
    return "GitHub" if _host_of(text) == "github.com" else "Portfolio"


# Delimiter Jinja2 đổi khác mặc định để không đụng cú pháp LaTeX ({}, %).
_env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    block_start_string=r"\BLOCK{",
    block_end_string="}",
    variable_start_string=r"\VAR{",
    variable_end_string="}",
    comment_start_string=r"\#{",
    comment_end_string="}",
    # Undefined thường (không StrictUndefined): field optional thiếu -> rỗng,
    # không raise. CV có nhiều field optional (dates, description...).
    autoescape=False,
)
_env.filters["tex"] = escape_tex
_env.filters["texurl"] = escape_tex_url
_env.filters["linklabel"] = link_label


def render(template: str, cv_data: dict, header: dict | None = None) -> str:
    """Render `<template>.tex.j2` với `cv_data` + `header` → chuỗi .tex đã escape.

    Template dùng biến `cv` (nội dung CV) và `hdr` (thông tin cá nhân cho header).
    """
    tpl = _env.get_template(f"{template}.tex.j2")
    return tpl.render(cv=cv_data, hdr=header or {})
