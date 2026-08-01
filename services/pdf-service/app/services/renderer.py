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


def render(template: str, cv_data: dict, header: dict | None = None) -> str:
    """Render `<template>.tex.j2` với `cv_data` + `header` → chuỗi .tex đã escape.

    Template dùng biến `cv` (nội dung CV) và `hdr` (thông tin cá nhân cho header).
    """
    tpl = _env.get_template(f"{template}.tex.j2")
    return tpl.render(cv=cv_data, hdr=header or {})
