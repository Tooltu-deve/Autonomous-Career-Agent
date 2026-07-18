# Design — CV Editor + LaTeX PDF Export & Job-selection Workflow

**Date:** 2026-07-18
**Status:** Approved (pending spec review)
**Scope:** Thêm luồng người dùng tìm/chọn job, chỉnh sửa CV trước khi xuất, và tách xuất PDF thành `pdf-service` render từ template LaTeX.

## 1. Mục tiêu & bối cảnh

Hiện tại pipeline chạy hoàn toàn tự động: `scraper → cv-agent → ats-agent`, trong đó ats-agent tự xuất PDF ở cuối. Người dùng **không** được xem/sửa CV trước khi ra PDF, và không kiểm soát job nào được tạo CV.

Thay đổi mong muốn:
1. Người dùng chọn **template CV** ngay lúc setup profile.
2. Người dùng nhập **tiêu chí tìm việc**; scraper cào theo yêu cầu và trả về danh sách job.
3. Người dùng **tick chọn** job muốn tạo CV.
4. Hệ thống sinh CV (RAG), **chấm điểm** với cổng PASS/FAIL; FAIL thì tự tạo lại (có feedback, giới hạn số lần).
5. Người dùng **xem preview + chỉnh sửa** CV đã PASS (React + Tiptap).
6. Người dùng xác nhận **xuất PDF**; `pdf-service` render template LaTeX + cvData → PDF để tải về.

Kiến trúc tổng thể (component + sequence diagram) đã cập nhật trong [docs/ARCHITECTURE.md](../../ARCHITECTURE.md).

## 2. Ràng buộc kiến trúc giữ nguyên

- Không cross-import giữa service. Giao tiếp đồng bộ **chỉ** qua API Gateway (HTTP); bất đồng bộ **chỉ** qua RabbitMQ (AMQP).
- Gateway chỉ routing + verify JWT, không có business logic, không truy vấn Postgres.
- Mỗi service chỉ ghi vào bảng mình sở hữu. Mọi service expose `GET /health`.
- Config qua `libs.common.config.settings`; queue names qua `libs.messaging.rabbitmq`; shared models qua `libs.schemas.models`.

## 3. Component mới & thay đổi

### 3.1 pdf-service (mới — service thứ 7)
- **Trách nhiệm:** stateless, nhận `{template, cv_data}` qua HTTP → render `.tex` → compile PDF → stream về. Không lưu file.
- **API:**
  - `POST /pdf/export` body `{ template: str, cv_data: dict }` → `application/pdf` (binary stream).
  - `GET /health`.
- **Cấu trúc:**
  ```
  app/
  ├── main.py
  ├── api/pdf.py            # PdfRouter — validate, delegate
  ├── schemas/pdf.py        # ExportRequest(template, cv_data)
  ├── services/renderer.py  # TemplateRenderer: cv_data + .tex.j2 → .tex (Jinja2)
  ├── services/compiler.py  # LatexCompiler: .tex → PDF (subprocess, tectonic)
  ├── templates/{classic,modern,academic}.tex.j2
  └── core/settings.py
  ```
- **Compiler:** Tectonic (single binary, tự tải package → image nhẹ hơn texlive-full).
- **Bảo mật/độ bền:**
  - `template` phải nằm trong whitelist `classic|modern|academic` (chống path injection) → sai trả `400`.
  - Escape triệt để ký tự đặc biệt LaTeX (`& % $ # _ { } ~ ^ \`) trong mọi giá trị user nhập.
  - Compile với `-no-shell-escape`, chạy trong thư mục tạm, timeout ~30s; lỗi/treo → `422` + log rút gọn; dọn thư mục tạm sau khi trả.

### 3.2 scraper-service (thay đổi — chạy theo yêu cầu)
- Bỏ mô hình tự chạy async. Thêm **API đồng bộ**:
  - `POST /jobs/search` body `{criteria}` → cào LinkedIn/Indeed theo tiêu chí, lưu bảng `jobs`, trả danh sách jobs.
  - `POST /jobs/select` body `{job_ids}` → publish mỗi job đã chọn vào `cv.requested` dạng `{user_id, job_id, attempt: 1}`.
- Là **producer** của queue `cv.requested`. Vẫn sở hữu bảng `jobs`.
- *Ghi chú vận hành:* cào web đồng bộ có thể chậm; ở phạm vi local/education chấp nhận được. Nếu sau này cần, tách search thành async (ngoài scope).

### 3.3 cv-agent-service (thay đổi — thêm read/update API + bảng cvs)
- **Consumer (async):** nghe `cv.requested` → RAG truy vấn profile embeddings → gọi LLM sinh CV JSON (**dùng feedback nếu là retry**) → upsert bảng `cvs` (`status=draft`) → publish `cv.generated`.
- **Read/Update API (sync):**
  - `GET /cvs/{id}` → trả `cv_data`.
  - `PUT /cvs/{id}` body `{cv_data}` → validate khớp schema `GeneratedCV.content`, cập nhật, `status=edited`. Sai schema → `422`.
- Sở hữu bảng `cvs`.
- **Cấu trúc thêm:** `api/cvs.py`, `schemas/cv.py`, `models/cv.py` (CvORM), `services/cv_repository.py`, `services/cv_agent.py`.

### 3.4 ats-agent-service (thay đổi — cổng PASS/FAIL + vòng retry)
- **Consumer:** nghe `cv.generated` → gọi LLM chấm điểm (0–100) + viết cover letter → ghi `ats_reports` kèm `status`:
  - `score >= ATS_PASS_THRESHOLD` → `status = PASS`.
  - `score < ngưỡng` và `attempt <= ATS_MAX_ATTEMPTS` → `status = FAIL`, **republish `cv.requested`** với `attempt+1` + `feedback` (weaknesses/advice).
  - `attempt > ATS_MAX_ATTEMPTS` → `status = NEEDS_REVIEW`, dừng.
- **Read API:** `GET /reports`.
- ats **không** ghi vào bảng `cvs` (tránh ghi chéo). PASS/FAIL/NEEDS_REVIEW nằm ở `ats_reports.status`.

### 3.5 profile-service (thay đổi — preferred_template)
- Thêm trường `preferred_template` (`classic|modern|academic`) vào hồ sơ; lưu Postgres, trả về qua `GET /profile`. Giá trị ngoài whitelist → `422`.
- User chọn template lúc setup profile; template **cố định** cho CV Editor (đổi phải sửa profile).

### 3.6 Frontend (thay đổi)
- **Setup profile:** thêm bước chọn template (kèm preview).
- **Job search:** form nhập tiêu chí → hiển thị danh sách job → tick chọn → "Tạo CV".
- **CV Editor (React + Tiptap):** hiển thị preview CV đã PASS theo template cố định; các trường tự do (summary, mô tả kinh nghiệm, bullet) dùng Tiptap rich-text; các trường cấu trúc (tên, ngày, skill tags) dùng input thường. **Không** có bộ chọn template ở đây.
- **Xuất PDF:** đọc `preferred_template` (qua `GET /profile`) + cvData → `POST /pdf/export` → tải PDF.
- Mọi call qua `lib/api.ts` → API Gateway.

### 3.7 API Gateway (thay đổi)
- Thêm forward routes: `/jobs/*` → scraper, `/cvs/*` → cv-agent, `/pdf/export` → pdf-service. Giữ `/profile` → profile, `/reports` → ats, auth routes → auth.

## 4. Mô hình dữ liệu

### 4.1 Tiptap ↔ cvData
`cv_data` là **JSON có cấu trúc duy nhất** chảy xuyên suốt (cv-agent sinh → lưu `cvs` → user sửa → pdf-service compile). Tiptap chỉ dùng cho các vùng rich-text; khi lưu, serialize ngược về đúng schema `GeneratedCV.content`.

### 4.2 Bảng mới `cvs` (Postgres — `infra/init-db/01_schema.sql`)
```sql
CREATE TABLE IF NOT EXISTS cvs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id),
    job_id      INTEGER REFERENCES jobs(id),
    cv_data     JSONB NOT NULL,
    status      VARCHAR(20) DEFAULT 'draft',   -- draft | edited
    created_at  TIMESTAMP DEFAULT now(),
    updated_at  TIMESTAMP DEFAULT now(),
    UNIQUE (user_id, job_id)                   -- cho phép upsert khi retry ghi đè bản CV cùng (user, job)
);
```
> Ràng buộc `UNIQUE(user_id, job_id)` là bắt buộc để `INSERT ... ON CONFLICT` (upsert) hoạt động khi vòng retry sinh lại CV cho cùng một job.

### 4.3 Thay đổi bảng `ats_reports`
- Thêm cột `status VARCHAR(20)` (`PASS | FAIL | NEEDS_REVIEW`).
- Thêm cột `attempt INTEGER DEFAULT 1`.
- Cột `pdf_path` cũ giữ nguyên nhưng **không dùng** (để `NULL`) — PDF không còn được ats sinh.

### 4.4 Thay đổi `libs/schemas/models.py`
- `ProfileData` thêm `preferred_template: str`.
- Cân nhắc thêm model message cho `cv.requested` (`CvRequest(user_id, job_id, attempt, feedback)`).

### 4.5 Thay đổi `libs/messaging/rabbitmq.py`
- `QUEUE_JOBS_SCRAPED` → **`QUEUE_CV_REQUESTED = "cv.requested"`**. Giữ `QUEUE_CV_GENERATED = "cv.generated"`.

### 4.6 Config mới (`libs/common/config.py`)
- `ATS_PASS_THRESHOLD: float = 70`
- `ATS_MAX_ATTEMPTS: int = 3`

## 5. Lưu trữ PDF
Stateless — không lưu. PDF luôn tái tạo được từ `cv_data` (bảng `cvs`) + `preferred_template` (profile). Caveat đã chấp nhận: nếu file `.tex` template hoặc version compiler đổi, PDF xuất lại có thể khác bản cũ (không cần bản bất biến ở giai đoạn này → YAGNI).

## 6. Scope cover letter
PDF export ở giai đoạn này **chỉ chứa CV**. Cover letter vẫn do ats sinh, nằm trong `ats_reports`, hiển thị ở dashboard. Cover letter PDF để sau.

## 7. Xử lý lỗi
| Tình huống | Xử lý |
|-----------|-------|
| `template` ngoài whitelist | pdf-service `400` |
| `cv_data` sai schema | `PUT /cvs/{id}` chặn `422`; pdf-service validate lại |
| LaTeX compile lỗi/treo | timeout ~30s → `422` + log rút gọn; dọn tạm |
| Ký tự đặc biệt LaTeX | escape ở TemplateRenderer + `-no-shell-escape` |
| cv-agent lỗi DB khi lưu draft | message nack/requeue |
| Vòng retry FAIL | attempt counter trong message; quá `ATS_MAX_ATTEMPTS` → `NEEDS_REVIEW`, dừng (không loop vô hạn) |

## 8. Testing
- **pdf-service:** TemplateRenderer (đổ dữ liệu + escape đặc biệt — test riêng vì là lỗ hổng injection); LatexCompiler (`.tex` hợp lệ → PDF magic bytes `%PDF`; lỗi → raise trong timeout); `POST /pdf/export` (200/400/422); `GET /health`. Ít nhất 1 integration test compile `.tex` thật cho mỗi template.
- **cv-agent:** CvRepository CRUD; `GET/PUT /cvs/{id}` (200/404/422); consumer nghe `cv.requested` → upsert `cvs` + publish `cv.generated` (mock RabbitMQ + LLM); retry dùng feedback.
- **ats-agent:** cổng PASS/FAIL theo ngưỡng; republish với attempt+1 + feedback; NEEDS_REVIEW khi quá max; ghi `ats_reports.status`.
- **scraper:** `POST /jobs/search` trả jobs + lưu DB; `POST /jobs/select` publish đúng payload vào `cv.requested`.
- **profile:** lưu/trả `preferred_template`; giá trị lạ → `422`.
- **Frontend:** CV Editor load cvData → render đúng template; serialize ngược đúng schema; setup profile lưu template.
- **Nguyên tắc:** mock ranh giới ngoài (RabbitMQ, LLM, Qdrant, subprocess LaTeX) ở unit test.

## 9. Ngoài scope (YAGNI)
- Lưu/versioning PDF snapshot bất biến.
- Cover letter trong PDF.
- Job search bất đồng bộ / streaming.
- Tự động chọn template theo job.
