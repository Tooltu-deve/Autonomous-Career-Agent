# libs — code Python dùng chung

Tầng nền được **mọi service** tham chiếu (không cross-import giữa các service).
Cài dạng editable từ gốc repo: `pip install -e .` (khai báo ở `pyproject.toml`).

## Module

- `common/`
  - `config.py` — `settings` (Pydantic `BaseSettings`), single source cho env config.
  - `logging.py` — `get_logger(name)` cấu hình log đồng nhất theo `settings.log_level`.
  - `jwt.py` — `create_access_token` / `decode_token` (auth-service cấp, gateway verify).
- `messaging/rabbitmq.py` — queue names `QUEUE_CV_REQUESTED` (`cv.requested`),
  `QUEUE_CV_GENERATED` (`cv.generated`) + `publish` / `consume` (pika, durable,
  manual-ack; nack+requeue khi handler lỗi).
- `llm/`
  - `adapter.py` — `LLMClient` ABC + `AnthropicClient` / `OpenAIClient` +
    `get_llm_client()` (chọn theo `settings.llm_provider`; default `claude-opus-4-8`).
  - `prompts.py` — prompt tái dùng: `cv_generation` (kèm feedback khi retry),
    `ats_scoring`, `cover_letter`.
- `schemas/models.py` — Pydantic models dùng chung: `Job`, `ProfileData`,
  `CvRequest`, `GeneratedCV` (+ `CVContent`/`ExperienceItem`/`EducationItem`),
  `ATSReport` (+ `Recommendation`). Bám theo `infra/init-db/01_schema.sql`.

## Test

```bash
pytest -q            # từ gốc repo (libs/tests)
```
