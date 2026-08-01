# Build context = repo root (xem docker-compose.yml).
FROM python:3.12-slim

# Tectonic cần curl + fontconfig + ca-certificates để tự tải package LaTeX.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl fontconfig ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://drop-sh.fullyjustified.net | sh \
    && mv tectonic /usr/local/bin/tectonic

WORKDIR /code
COPY services/pdf-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY services/pdf-service/app ./app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
