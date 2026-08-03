# Build context = repo root (xem docker-compose.yml).
FROM python:3.12-slim

# Tectonic cần curl + fontconfig + ca-certificates để tự tải package LaTeX.
# Tải binary musl (static) theo kiến trúc — bản aarch64-gnu không tồn tại trên
# GitHub releases nên installer script mặc định fail trên Apple Silicon.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl fontconfig ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && case "$(uname -m)" in \
         aarch64) TRIPLE=aarch64-unknown-linux-musl ;; \
         *)       TRIPLE=x86_64-unknown-linux-musl ;; \
       esac \
    && curl -fsSL "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.17.0/tectonic-0.17.0-${TRIPLE}.tar.gz" \
       | tar -xz -C /usr/local/bin tectonic

RUN printf '%s\n' \
      '\documentclass[10pt,a4paper]{article}' \
      '\usepackage[utf8]{inputenc}' \
      '\usepackage[margin=0.75in]{geometry}' \
      '\usepackage[hidelinks]{hyperref}' \
      '\usepackage{enumitem}' \
      '\usepackage{microtype}' \
      '\usepackage{paracol}' \
      '\usepackage{titlesec}' \
      '\usepackage{xcolor}' \
      '\begin{document}warmup\end{document}' \
      > /tmp/warmup.tex \
    && tectonic /tmp/warmup.tex \
    && rm -f /tmp/warmup.tex /tmp/warmup.pdf
WORKDIR /code
COPY services/pdf-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY services/pdf-service/app ./app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
