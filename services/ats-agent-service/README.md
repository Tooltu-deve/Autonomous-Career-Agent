# ats-agent-service

Agent chấm điểm ATS (FastAPI):
- **Consumer** nghe queue `cv.generated` → LLM chấm điểm CV so với JD (0–100)
  + viết cover letter → ghi bảng `ats_reports` (1:1 với cv_generation, retry ghi đè).
- **Cổng PASS/FAIL:** đạt `ATS_PASS_THRESHOLD` → `applications.generation_status=completed`;
  dưới ngưỡng còn lượt (`ATS_MAX_ATTEMPTS`) → republish `cv.requested` (attempt+1, kèm feedback);
  hết lượt → `needs_review`.
- **Read API:** `GET /applications` + `GET /applications/{id}` (gộp application + cv + report).

## Chạy local
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Healthcheck: `GET /health`

## Test
```bash
pytest -q
```
