# Design — Đồng bộ `libs/` với API Contract & DB Schema

**Date:** 2026-07-24
**Status:** Implemented
**Scope:** Đối chiếu shared libraries (`libs/`) với `docs/API_CONTRACT.md`, `infra/init-db/01_schema.sql`, spec CV-editor (2026-07-18) và `docs/CLASS_DIAGRAM.md`; sửa 5 điểm lệch (F1–F5).

## 1. Bối cảnh

Kiểm tra `libs/` (config, messaging, schemas, LLM) so với các tài liệu nguồn phát hiện 5 điểm
lệch. Nguyên tắc chọn hướng: báo cáo mọi mâu thuẫn giữa tài liệu, không mặc định tài liệu nào
thắng; với mỗi điểm, chốt hướng theo quyết định của maintainer (ghi ở cột "Quyết định").

Cơ sở đối chiếu: `docs/API_CONTRACT.md` + `infra/init-db/01_schema.sql` là nguồn cụ thể/mới nhất;
`docs/CLASS_DIAGRAM.md` được cập nhật theo khi lệch.

## 2. Các điểm lệch & hướng xử lý

| # | Điểm lệch | Mức | Quyết định | Hướng giải quyết |
|---|-----------|-----|-----------|------------------|
| F1 | `consume()` requeue cả message JSON hỏng → poison-message loop; trái `API_CONTRACT` ("payload sai JSON → nack không requeue") | 🔴 Cao | Giữ `raise` ở nhánh handler-lỗi; không dùng DLX | Tách xử lý parse khỏi handler |
| F2 | `GeneratedCV{user_id, job_id, content}` không khớp message `cv.generated` (`{cv_generation_id}`) và `GET /cvs` (`{application_id, cv_json,...}`) | 🟡 TB | Đưa libs khớp API_CONTRACT + SQL; cập nhật cả class diagram | Reshape `GeneratedCV` + thêm `CvGenerated` |
| F3 | Enum orchestration (`generation_status`, `pipeline_stage`, `cv_edit_status`) có trong SQL/API nhưng thiếu trong libs | 🟡 TB | Đưa hết vào libs (Mức A: chỉ export type alias) | Thêm 3 `Literal` + test chống drift |
| F4 | Message thiếu `schema_version` dù `API_CONTRACT` §B ghi "bắt buộc" | 🟡 TB | A1 (hằng dùng chung) + B1 (`int`, không ghim `Literal`) | `SCHEMA_VERSION = 1` + field trên 2 message model |
| F5 | `ProfileData.experience/education` để `list[dict]` dù đã có model typed | 🔹 Thấp | Hướng 1 — tái dùng `ExperienceItem`/`EducationItem` | Đổi sang typed; `display_order` không mang vào (list giữ thứ tự) |

## 3. Thay đổi theo file

### `libs/messaging/rabbitmq.py` (F1)
- `consume()._on_message`: tách `json.loads` (try riêng) khỏi `handler` (try riêng).
  - Payload sai JSON → `basic_nack(requeue=False)` + `return` (không crash consumer, hết poison loop).
  - Handler lỗi → `basic_nack(requeue=True)` + `raise` (giữ nguyên hành vi crash-để-supervisor-backoff).

### `libs/schemas/models.py` (F2, F3, F4, F5)
- **F4:** thêm hằng module `SCHEMA_VERSION = 1`; `CvRequest` và `CvGenerated` có `schema_version: int = SCHEMA_VERSION`.
- **F3:** thêm 3 `Literal` khớp ENUM Postgres:
  - `GenerationStatus` (8 giá trị), `PipelineStage` (5 giá trị), `CvEditStatus` (`draft|edited`).
- **F2:** reshape `GeneratedCV` → `{id?, application_id, content: CVContent, edit_status: CvEditStatus="draft", model_used, generated_at?}` (bỏ `user_id`/`job_id` mồ côi); thêm message model `CvGenerated{schema_version, cv_generation_id}`.
- **F5:** di chuyển `ExperienceItem`/`EducationItem` lên trước `ProfileData` (dùng chung); `ProfileData.experience: list[ExperienceItem]`, `education: list[EducationItem]`.

### `docs/CLASS_DIAGRAM.md` (F2)
- Cập nhật box `GeneratedCV` → `{id, application_id, content, edit_status, model_used}`; thêm box `CvGenerated{cv_generation_id}`.
- `CvGeneratedConsumer.on_message(GeneratedCV)` → `on_message(CvGenerated)`.

### `libs/tests/test_rabbitmq.py` (F1)
- Thêm `test_consume_nacks_without_requeue_on_bad_json`.

### `libs/tests/test_models.py` (F2–F5)
- `test_status_literals_match_sql_enum` (parametrize 5 enum) + `test_template_name_matches_profiles_check` — đọc thẳng `01_schema.sql`, chống drift.
- `test_messages_stamp_schema_version`, `test_cv_generated_message_carries_only_pointer`.
- `test_generated_cv_accepts_valid_content` (cập nhật shape mới) + `test_generated_cv_rejects_bad_edit_status`.
- `test_profile_data_parses_typed_experience_education` + `test_profile_data_rejects_experience_missing_required_field`.

## 4. Xác minh
- `pytest -q`: 32 passed (khởi điểm 20 → +12 test).
- `ruff check libs/`: sạch. `black --target-version py312 libs/`: chuẩn.

## 5. Ngoài scope (ghi chú)
- **F4 versioning từng message riêng (A2)** và **ghim `Literal[1]` (B2)** — không làm, dùng hằng chung + `int` cho đơn giản/forward-compat.
- **Dead-letter queue** cho message JSON hỏng — không làm (YAGNI ở phạm vi local/education).
- **Model `Application`** dùng các enum mới — chưa tạo (F3 chỉ export type alias); cân nhắc khi service cần.
- Cảnh báo Pydantic v1 `class Config` ở `libs/common/config.py` — chưa đổi (ngoài scope đợt này).
