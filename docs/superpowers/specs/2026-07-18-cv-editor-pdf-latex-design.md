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
- **Nguồn `criteria`:** user không nhập tiêu chí mỗi lần — chỉ bấm "Tìm job". Tiêu chí lấy từ `profile_preferences` (đã lưu lúc setup profile). **Frontend** đọc preferences (qua `GET /profile`) rồi truyền vào body `POST /jobs/search`. scraper **không** đọc thẳng `profile_preferences` (tránh cross-service DB). Muốn đổi tiêu chí → sửa profile.
- *Ghi chú vận hành:* cào web đồng bộ có thể chậm; ở phạm vi local/education chấp nhận được. Nếu sau này cần, tách search thành async (ngoài scope).

### 3.3 cv-agent-service (thay đổi — thêm read/update API + bảng cv_generations)
- **Consumer (async):** nghe `cv.requested` → RAG truy vấn profile embeddings → gọi LLM sinh CV JSON (**dùng feedback nếu là retry**) → upsert bảng `cv_generations` (`edit_status=draft`, theo `application_id`) → cập nhật `applications.generation_status=cv_generated` → publish `cv.generated`.
- **Read/Update API (sync):**
  - `GET /cvs/{id}` → trả `cv_json`.
  - `PUT /cvs/{id}` body `{cv_json}` → validate khớp schema `GeneratedCV.content`, cập nhật, `edit_status=edited`. Sai schema → `422`.
- Sở hữu bảng `cv_generations`.
- **Cấu trúc thêm:** `api/cvs.py`, `schemas/cv.py`, `models/cv.py` (CvGenerationORM), `services/cv_repository.py`, `services/cv_agent.py`.

### 3.4 ats-agent-service (thay đổi — cổng PASS/FAIL + vòng retry)
- **Consumer:** nghe `cv.generated` → gọi LLM chấm điểm (0–100) + viết cover letter → ghi `ats_reports`, rồi cập nhật `applications.generation_status`:
  - `overall_score >= ATS_PASS_THRESHOLD` → `completed` (PASS).
  - `score < ngưỡng` và `attempt < ATS_MAX_ATTEMPTS` → **republish `cv.requested`** với `attempt+1` + `feedback` (weaknesses/advice); `generation_status` quay về `cv_queued`.
  - `attempt >= ATS_MAX_ATTEMPTS` → `needs_review`, dừng.
- **Read API:** `GET /reports`.
- ats **không** ghi vào `cv_generations` (tránh ghi chéo). Cổng PASS/FAIL/NEEDS_REVIEW phản ánh ở `applications.generation_status` (xem ngoại lệ single-writer ở §4).

### 3.5 profile-service (thay đổi — preferred_template + job criteria)
- Thêm trường `preferred_template` (`classic|modern|academic`) vào hồ sơ; lưu Postgres, trả về qua `GET /profile`. Giá trị ngoài whitelist → `422`.
- Sở hữu `profile_preferences` (target_role, salary, locations, remote…) — **tiêu chí tìm job**, set lúc setup profile và trả về qua `GET /profile`.
- User chọn template + tiêu chí lúc setup profile; cả hai **cố định** cho các lần dùng sau (đổi phải sửa profile).

### 3.6 Frontend (thay đổi)
- **Setup profile:** thêm bước chọn template (kèm preview) và nhập tiêu chí tìm job (target_role, salary, location, remote…).
- **Job search:** chỉ cần bấm "Tìm job" (không nhập lại tiêu chí) → FE lấy criteria từ profile đã tải → `POST /jobs/search` → hiển thị danh sách job → tick chọn → "Tạo CV".
- **CV Editor (React + Tiptap):** hiển thị preview CV đã PASS theo template cố định; các trường tự do (summary, mô tả kinh nghiệm, bullet) dùng Tiptap rich-text; các trường cấu trúc (tên, ngày, skill tags) dùng input thường. **Không** có bộ chọn template ở đây.
- **Xuất PDF:** đọc `preferred_template` (qua `GET /profile`) + cvData → `POST /pdf/export` → tải PDF.
- Mọi call qua `lib/api.ts` → API Gateway.

### 3.7 API Gateway (thay đổi)
- Thêm forward routes: `/jobs/*` → scraper, `/cvs/*` → cv-agent, `/pdf/export` → pdf-service. Giữ `/profile` → profile, `/reports` → ats, auth routes → auth.

## 4. Mô hình dữ liệu

Schema đầy đủ tại [`infra/init-db/01_schema.sql`](../../../infra/init-db/01_schema.sql). Dùng UUID + enum, chuẩn hoá profile thành bảng con, và **`applications` làm anchor row per user-job** — tách trạng thái pipeline tự động (`generation_status`) khỏi tracking thủ công (`pipeline_stage`). `cvs` (thiết kế ban đầu) được thay bằng **`cv_generations`** liên kết 1:1 với `applications`.

### 4.1 Tiptap ↔ cv_json
`cv_json` là **JSON có cấu trúc duy nhất** chảy xuyên suốt (cv-agent sinh → lưu `cv_generations.cv_json` → user sửa → pdf-service compile). Tiptap chỉ dùng cho các vùng rich-text; khi lưu, serialize ngược về đúng schema `GeneratedCV.content`.

### 4.2 Ánh xạ quyết định thiết kế → schema
| Quyết định | Thể hiện trong schema |
|-----------|----------------------|
| Chọn template lúc setup profile | `profiles.preferred_template` (CHECK `classic\|modern\|academic`) |
| Tiêu chí tìm job (lưu theo profile) | `profile_preferences` (target_role, salary, locations, remote) — FE truyền vào `POST /jobs/search` |
| Lưu CV để user sửa | `cv_generations.cv_json` (JSONB), 1:1 với `applications` — retry upsert ghi đè |
| Trạng thái sửa CV | `cv_generations.edit_status` (`draft \| edited`) |
| Vòng retry ATS | `applications.attempt` (đếm số lần sinh) + republish `cv.requested` |
| Cổng PASS/FAIL/NEEDS_REVIEW | `applications.generation_status`: `completed` = PASS; `needs_review` = hết lượt vẫn dưới ngưỡng; `failed` = lỗi hệ thống |
| Điểm & feedback ATS | `ats_reports.overall_score`, `score_breakdown`, `matched/missing_keywords`, `recommendations` |
| PDF stateless (không lưu) | `ats_reports` **không** có cột `*_pdf_path` |

> Vì `cv_generations.application_id` và `ats_reports.cv_generation_id` đều `UNIQUE` (1:1), retry **ghi đè** bản CV/report cũ — chỉ giữ bản mới nhất. Feedback cho lần sinh lại đi qua message `cv.requested`, không cần lưu lịch sử ở DB.

### 4.3 Thay đổi `libs/schemas/models.py`
- `ProfileData` thêm `preferred_template: str`.
- Thêm message model cho `cv.requested`: `CvRequest(user_id, job_id, attempt, feedback)`.

### 4.4 Thay đổi `libs/messaging/rabbitmq.py`
- `QUEUE_JOBS_SCRAPED` → **`QUEUE_CV_REQUESTED = "cv.requested"`**. Giữ `QUEUE_CV_GENERATED = "cv.generated"`.

### 4.5 Config mới (`libs/common/config.py`)
- `ATS_PASS_THRESHOLD: float = 70`
- `ATS_MAX_ATTEMPTS: int = 3`

### 4.6 Ngoại lệ single-writer cho `applications`
`applications` là **bảng orchestration dùng chung**: nhiều service cùng cập nhật `generation_status` khi CV đi qua pipeline (scraper `cv_queued` → cv-agent `cv_generating/cv_generated` → ats `ats_scoring/completed/needs_review`). Đây là **ngoại lệ có chủ đích** với nguyên tắc "mỗi service chỉ ghi bảng của mình" — chấp nhận để có một anchor trạng thái duy nhất cho frontend poll. Các bảng nội dung (`cv_generations`, `ats_reports`) vẫn giữ single-writer đúng chủ sở hữu. Ngoại lệ này được ghi rõ trong ARCHITECTURE.md.

## 5. Lưu trữ PDF
Stateless — không lưu. PDF luôn tái tạo được từ `cv_generations.cv_json` + `profiles.preferred_template`. Caveat đã chấp nhận: nếu file `.tex` template hoặc version compiler đổi, PDF xuất lại có thể khác bản cũ (không cần bản bất biến ở giai đoạn này → YAGNI). `ats_reports` **không** có cột lưu path PDF.

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
- **cv-agent:** CvRepository CRUD; `GET/PUT /cvs/{id}` (200/404/422); consumer nghe `cv.requested` → upsert `cv_generations` + cập nhật `applications.generation_status` + publish `cv.generated` (mock RabbitMQ + LLM); retry dùng feedback.
- **ats-agent:** cổng theo ngưỡng; republish với attempt+1 + feedback; `needs_review` khi quá max; ghi `ats_reports` + cập nhật `applications.generation_status` (`completed`/`needs_review`).
- **scraper:** `POST /jobs/search` trả jobs + lưu DB; `POST /jobs/select` publish đúng payload vào `cv.requested`.
- **profile:** lưu/trả `preferred_template`; giá trị lạ → `422`.
- **Frontend:** CV Editor load cvData → render đúng template; serialize ngược đúng schema; setup profile lưu template.
- **Nguyên tắc:** mock ranh giới ngoài (RabbitMQ, LLM, Qdrant, subprocess LaTeX) ở unit test.

## 9. Ngoài scope (YAGNI)
- Lưu/versioning PDF snapshot bất biến.
- Cover letter trong PDF.
- Job search bất đồng bộ / streaming.
- Tự động chọn template theo job.
