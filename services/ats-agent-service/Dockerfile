# Build context = repo root (see docker-compose.yml) so shared libs/ is available.
FROM python:3.12-slim
WORKDIR /code
COPY pyproject.toml ./
COPY services/ats-agent-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY libs ./libs
RUN pip install --no-cache-dir -e .
COPY services/ats-agent-service/app ./app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
