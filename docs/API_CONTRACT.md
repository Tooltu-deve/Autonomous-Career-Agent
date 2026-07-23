# API Contract — Autonomous Career Agent

Tài liệu này định nghĩa **hợp đồng giao tiếp** giữa các thành phần trong hệ thống.
Có **hai loại contract**, cả hai đều bắt buộc:

1. **REST contract** — HTTP đồng bộ: Frontend → API Gateway → service nghiệp vụ.
2. **Message contract** — payload bất đồng bộ trên RabbitMQ trong pipeline `cv-agent → ats-agent`
   (message được khởi tạo khi user bấm "Tạo CV", xem A5 `POST /applications`).

> Message contract quan trọng ngang REST: nếu producer publish một dạng mà consumer
> đọc một dạng khác, pipeline gãy y hệt như gọi sai REST — nhưng không có HTTP 400 báo cho biết.
>
> **Flow tổng quát:** user bấm "Tìm Jobs" (`POST /jobs/search` → scraper ghi jobs) → user tick chọn
> job → bấm "Tạo CV" (`POST /applications` → publish queue) → cv-agent sinh CV → ats-agent chấm điểm.

## Quy ước chung

- **Base URL (qua Gateway):** `http://localhost:8000`
- **Định dạng:** JSON (`Content-Type: application/json`). Body request/response validate bằng Pydantic (`libs/schemas/models.py`).
- **Kiểu ID:** **UUID** cho mọi entity (`users`, `profiles`, `profile_preferences`, `profile_experiences`, `profile_educations`, `profile_skills`, `jobs`, `applications`, `cv_generations`, `ats_reports`). Sinh phía ứng dụng để có `id` trước khi ghi DB.
- **Mô hình dữ liệu:** một **`application`** = một lần user ứng tuyển vào một job (nối `user_id` + `job_id`). CV và ATS report gắn theo chuỗi `applications → cv_generations → ats_reports`. Danh tính xuyên suốt pipeline là `application_id`.
- **Thời gian:** ISO-8601 UTC (`2026-07-16T09:30:00Z`).
- **Auth:** JWT Bearer. Client gửi `Authorization: Bearer <access_token>`. Gateway verify chữ ký (`JWT_SECRET`) rồi mới forward. Endpoint đánh dấu 🔒 yêu cầu token hợp lệ.
- **`user_id` không nằm trong request body** ở các route đã đăng nhập — Gateway trích từ token và truyền xuống service. Client không tự khai `user_id` (chống giả mạo).

### Mã trạng thái dùng thống nhất

| Code | Khi nào |
|------|---------|
| `200 OK` | GET / PUT thành công |
| `201 Created` | POST tạo resource mới |
| `202 Accepted` | Nhận request, xử lý **bất đồng bộ** (đã đẩy vào queue, chưa có kết quả) |
| `400 Bad Request` | Body sai định dạng / thiếu field |
| `401 Unauthorized` | Thiếu / sai / hết hạn token |
| `404 Not Found` | Resource không tồn tại (hoặc không thuộc về user hiện tại) |
| `409 Conflict` | Vi phạm ràng buộc duy nhất (vd email đã đăng ký) |
| `422 Unprocessable Entity` | Pydantic validation fail (FastAPI trả tự động) |

### Định dạng lỗi (thống nhất mọi service)

```json
{
  "detail": "Email đã được đăng ký"
}
```

---

# Phần A — REST Contract

## A1. Auth Service  `/auth`

### `POST /auth/register` → `201`
Đăng ký tài khoản.

Request:
```json
{
  "email": "user@example.com",
  "password": "at-least-8-chars",
  "full_name": "Nguyen Van A"
}
```
Response `201`:
```json
{
  "id": "3f9a1b2c-...-uuid",
  "email": "user@example.com",
  "full_name": "Nguyen Van A",
  "created_at": "2026-07-16T09:30:00Z"
}
```
Lỗi: `409` email trùng, `422` email/password không hợp lệ.

### `POST /auth/login` → `200`
Request:
```json
{ "email": "user@example.com", "password": "..." }
```
Response `200`:
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "expires_in": 3600
}
```
Lỗi: `401` sai thông tin đăng nhập.

---

## A2. Profile Service  `/profile`  🔒

Quản lý hồ sơ dùng để sinh CV. Một user có đúng một `profiles` row; các phần chi tiết
(experiences, educations, skills) là bảng con `profile_id → profiles.id`. Khi ghi profile,
service đồng thời **upsert embedding lên Qdrant** (index cho RAG) — hành vi nội bộ, không có trong response.

### `GET /profile` → `200`
Trả về profile lồng của user hiện tại (`user_id` lấy từ token; `profiles.id` gộp các bảng con).
```json
{
  "id": "profile-uuid",
  "user_id": "user-uuid",
  "headline": "Backend Engineer",
  "summary": "Backend engineer, 3 năm...",
  "location": "Ho Chi Minh City",
  "phone": "+84...",
  "github_url": "https://github.com/...",
  "linkedin_url": "https://linkedin.com/in/...",
  "preferred_template": "modern",
  "experiences": [
    {
      "id": "exp-uuid", "title": "Backend Dev", "organization": "ACME",
      "start_date": "2023-01-01", "end_date": "2025-01-01",
      "description": "...", "display_order": 1
    }
  ],
  "educations": [
    {
      "id": "edu-uuid", "school": "HCMUS", "degree": "BSc",
      "field_of_study": "Computer Science", "start_date": "2019-09-01",
      "end_date": "2023-06-01", "description": "...", "display_order": 1
    }
  ],
  "skills": [
    { "id": "skill-uuid", "skill_name": "python" },
    { "id": "skill-uuid", "skill_name": "fastapi" }
  ]
}
```
Lỗi: `404` chưa có profile.

### `PUT /profile` → `200`
Tạo mới hoặc thay toàn bộ profile + các bảng con (idempotent). Body giống response nhưng
**không kèm `id`/`user_id`** (lấy từ token). Response = profile sau cập nhật. Side-effect: re-embed Qdrant.

---

## A3. Profile Preferences  `/profile/preferences`  🔒

Tiêu chí ứng tuyển của user — **scraper dùng để cào job phù hợp** (khởi động pipeline).
Gắn 1-1 với `profiles` (`profile_preferences.profile_id → profiles.id`).

### `GET /profile/preferences` → `200`
```json
{
  "id": "pref-uuid",
  "profile_id": "profile-uuid",
  "target_role": "Backend Engineer",
  "expected_salary_min": 1500,
  "expected_salary_max": 2500,
  "currency": "VND",
  "preferred_locations": ["Ho Chi Minh City", "Remote"],
  "remote_preference": "hybrid"
}
```

### `PUT /profile/preferences` → `200`
Request (không kèm `id`/`profile_id` — suy từ token):
```json
{
  "target_role": "Backend Engineer",
  "expected_salary_min": 1500,
  "expected_salary_max": 2500,
  "currency": "VND",
  "preferred_locations": ["Ho Chi Minh City", "Remote"],
  "remote_preference": "hybrid"
}
```
Scraper cào job theo `target_role` + `preferred_locations`.

---

## A4. Jobs  `/jobs`  🔒

Job đã cào (lưu Postgres). Flow: user bấm **"Tìm Jobs"** → `POST /jobs/search` chạy scraper →
ghi `jobs` → user xem `GET /jobs`, tick chọn → bấm "Tạo CV" (xem A5 `POST /applications`).
Scraper **chỉ ghi jobs, không tự publish** message.

### `POST /jobs/search` → `202`
User bấm "Tìm Jobs". Kích hoạt scraper cào theo `profile_preferences` (`target_role` +
`preferred_locations`) của user hiện tại. Chạy nền (cào có thể lâu / bị rate-limit).
Request (tuỳ chọn override tiêu chí; bỏ trống = dùng preferences đã lưu):
```json
{
  "target_role": "Backend Engineer",
  "locations": ["Ho Chi Minh City", "Remote"]
}
```
Response `202`:
```json
{ "status": "scraping", "message": "Đang tìm job, xem lại GET /jobs sau ít phút" }
```
> Nếu nhóm muốn đồng bộ (cào nhanh, chờ được) thì trả `200` kèm danh sách job luôn.

### `GET /jobs?page=1&limit=20` → `200`
Danh sách job phân trang.
```json
{
  "items": [
    {
      "id": "job-uuid",
      "source": "linkedin",
      "external_job_id": "ln-123456",
      "title": "Backend Engineer",
      "company": "ACME",
      "location": "Ho Chi Minh City",
      "url": "https://...",
      "description": "JD...",
      "posted_at": "2026-07-15T00:00:00Z",
      "scraped_at": "2026-07-16T08:00:00Z",
      "status": "active",
      "expires_at": "2026-08-16T00:00:00Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 57
}
```
> Enum (khớp dbdiagram):
> - `source` (`job_source`): `"linkedin"` | `"indeed"` | `"manual"`
> - `status` (`job_status`): `"active"` | `"expired"` | `"closed"` (mặc định `active`)
>
> `raw_data` (jsonb payload gốc) là nội bộ, không trả ra API.

### `GET /jobs/{job_id}` → `200`
Chi tiết một job. `404` nếu không tồn tại.

---

## A5. Applications  `/applications`  🔒

Mỗi `application` = user ứng tuyển một job. Là **gốc của pipeline**: CV và ATS report gắn theo
`applications → cv_generations → ats_reports`. Đây là nơi user theo dõi tiến trình.

### `POST /applications` → `202`
User tick chọn job trong list rồi bấm **"Tạo CV"**. Với mỗi `job_id`: tạo `applications` row
(nối `user_id` từ token + `job_id`) và **publish `{application_id}` vào queue `jobs.scraped`**
để cv-agent xử lý. Đây là **điểm khởi động pipeline** (không phải scraper).
Request:
```json
{ "job_ids": ["job-uuid-1", "job-uuid-2"] }
```
Response `202`:
```json
{
  "applications": [
    { "id": "app-uuid-1", "job_id": "job-uuid-1", "generation_status": "cv_queued" },
    { "id": "app-uuid-2", "job_id": "job-uuid-2", "generation_status": "cv_queued" }
  ]
}
```
- **Idempotent:** đã có application cho `(user_id, job_id)` thì trả lại cái cũ, không tạo trùng.
- Lỗi: `404` nếu `job_id` không tồn tại; `422` nếu `job_ids` rỗng.

### `GET /applications?page=1&limit=20` → `200`
Danh sách application của user (rút gọn), kèm trạng thái pipeline.
```json
{
  "items": [
    {
      "id": "app-uuid",
      "job_id": "job-uuid",
      "job_title": "Backend Engineer",
      "company": "ACME",
      "generation_status": "completed",
      "pipeline_stage": "saved",
      "overall_score": 82,
      "created_at": "2026-07-16T09:00:00Z"
    }
  ],
  "page": 1, "limit": 20, "total": 12
}
```
> Enum của `applications` (khớp dbdiagram):
> - `generation_status` — tiến trình **kỹ thuật** của pipeline sinh CV/chấm điểm:
>   `"saved"` | `"cv_queued"` | `"cv_generating"` | `"cv_generated"` | `"ats_scoring"` |
>   `"completed"` | `"needs_review"` | `"failed"` (mặc định `saved`)
> - `pipeline_stage` — trạng thái **ứng tuyển** do user quản lý (không phải trạng thái pipeline AI):
>   `"saved"` | `"applied"` | `"interview"` | `"offer"` | `"rejected"` (mặc định `saved`)
>
> `attempt` + `error_message` (nội bộ) dùng để retry khi sinh CV lỗi.

### `GET /applications/{application_id}` → `200`
Chi tiết đầy đủ — gộp `applications` + `cv_generations` + `ats_reports`:
```json
{
  "id": "app-uuid",
  "user_id": "user-uuid",
  "job_id": "job-uuid",
  "generation_status": "completed",
  "pipeline_stage": "saved",
  "cv_generation": {
    "id": "cvgen-uuid",
    "cv_json": { "...": "CV có cấu trúc" },
    "edit_status": "draft",
    "model_used": "claude-opus-4-8",
    "generated_at": "2026-07-16T09:05:00Z"
  },
  "ats_report": {
    "id": "report-uuid",
    "overall_score": 82,
    "score_breakdown": { "keywords": 70, "experience": 90 },
    "matched_keywords": ["python", "fastapi"],
    "missing_keywords": ["kubernetes"],
    "recommendations": ["Thêm mục CI/CD"],
    "cover_letter_text": "Dear Hiring Manager, ...",
    "model_used": "claude-opus-4-8",
    "generated_at": "2026-07-16T09:07:00Z"
  },
  "created_at": "2026-07-16T09:00:00Z"
}
```
`404` nếu application không tồn tại / không thuộc user. `cv_generation`/`ats_report` có thể `null`
nếu pipeline chưa chạy xong (xem `pipeline_stage`).
> `cv_generation.edit_status` (`cv_edit_status` enum): `"draft"` (AI vừa sinh, chưa sửa) | `"edited"` (user đã chỉnh). Mặc định `draft`.

---

# Phần B — Message Contract (RabbitMQ)

Tên queue khai báo tập trung tại `libs.messaging.rabbitmq`.
Mọi payload là **một JSON object**. Trường `schema_version` bắt buộc để về sau đổi format không làm gãy consumer cũ.
Danh tính xuyên suốt pipeline là **`application_id`** (khớp FK `applications → cv_generations → ats_reports`).

## B1. Queue `jobs.scraped`   (api-gateway/backend → cv-agent)

> Tên queue giữ nguyên (khai báo tại `libs.messaging.rabbitmq`), nhưng **producer là endpoint
> `POST /applications`**, không phải scraper. Scraper chỉ ghi `jobs` (qua `POST /jobs/search`),
> **không publish**. Message chỉ được đẩy khi user tick chọn job + bấm "Tạo CV".

Khi user bấm "Tạo CV": với mỗi `job_id` đã chọn, backend (1) tạo `applications` row nối
`user_id + job_id`, (2) publish `application_id`. cv-agent tự tra `applications` để lấy `user_id`
(→ profile trên Qdrant) và `job_id` (→ JD).

```json
{
  "schema_version": 1,
  "application_id": "app-uuid"
}
```
- Payload gọn để nguồn sự thật luôn là DB, không sợ message và DB lệch nhau.
- Backend sinh UUID cho `applications` **trước** khi publish → không phụ thuộc round-trip DB.

## B2. Queue `cv.generated`   (cv-agent → ats-agent)

Sau khi RAG + LLM sinh xong CV, cv-agent ghi `cv_generations` row (`cv_json`) rồi publish `cv_generation_id`.
```json
{
  "schema_version": 1,
  "cv_generation_id": "cvgen-uuid"
}
```
- `ats-agent` tra `cv_generations` (→ `cv_json`, `application_id` → job JD) → chấm điểm + cover letter
  → ghi `ats_reports` (`cv_generation_id → cv_generations.id`). Đọc lại qua `GET /applications/{id}`.

## Quy tắc xử lý message (áp dụng cho mọi consumer)

- **Idempotent:** khoá theo `application_id` (B1) / `cv_generation_id` (B2) — xử lý lại không tạo bản ghi trùng.
- **ack sau khi xong:** chỉ `ack` khi đã ghi DB / publish thành công; handler lỗi → `nack` + requeue; payload sai JSON → `nack` không requeue. (Đúng như implement trong `libs/messaging/rabbitmq.py`.)
- **Không tin payload mù quáng:** validate bằng Pydantic khi nhận; tra DB kiểm id tồn tại trước khi xử lý.

---

# Phụ lục — Ánh xạ bảng DB ↔ Endpoint / Message

| Bảng (dbdiagram) | Dùng ở | Ghi chú |
|---|---|---|
| `users` | `POST /auth/*` | id UUID |
| `profiles` + `profile_experiences`/`_educations`/`_skills` | `GET/PUT /profile` | response lồng theo `profile_id` |
| `profile_preferences` | `GET/PUT /profile/preferences` | scraper đọc `target_role`, `preferred_locations` |
| `jobs` | `GET /jobs` | enum `source`, `status`; `raw_data` nội bộ |
| `applications` | `GET /applications`, message `jobs.scraped` | gốc pipeline; enum `generation_status`, `pipeline_stage` |
| `cv_generations` | `GET /applications/{id}`, message `cv.generated` | `cv_json`, enum `edit_status` |
| `ats_reports` | `GET /applications/{id}` | `cv_generation_id → cv_generations.id` |

> **Chưa khớp với code hiện tại** (cần vá ở bước sau):
> - `libs/schemas/models.py` còn theo mô hình cũ (`Job`, `ProfileData` phẳng, `GeneratedCV`, `ATSReport`) → cần viết lại theo schema dbdiagram (tách profile, thêm `Application`, `CVGeneration`; id kiểu `UUID`).
> - `infra/init-db/01_schema.sql` mới có 3 bảng (`users`, `jobs`, `ats_reports`) → cần cập nhật thành 10 bảng của schema mới.
> - `api-gateway` chưa route `/applications`, `/profile/preferences` (chưa `depends_on` các service tương ứng).
> - Message contract đổi từ `{user_id, job}` / `{user_id, job_id, content}` sang `{application_id}` / `{cv_generation_id}` — cv-agent/ats-agent phải theo id-based.
> - **Flow user-triggered:** producer của `jobs.scraped` là `POST /applications` (khi user bấm "Tạo CV"), KHÔNG phải scraper. Scraper chỉ ghi jobs qua `POST /jobs/search`. Cần thêm 2 endpoint này + `api-gateway` route tương ứng.
> - **Kiểu list:** `preferred_locations`, `matched_keywords`, `missing_keywords` là **list of string**
>   (API trả JSON array). DBML đã ghi chú `Array TEXT[] in DB` — khi hiện thực hoá `01_schema.sql`
>   nhớ dùng `TEXT[]`, không phải `varchar` đơn.
