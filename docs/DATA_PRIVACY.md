# Chính sách Bảo mật & Quản lý Dữ liệu — Autonomous Career Agent

Tài liệu quy định cách **dữ liệu CV, hồ sơ người dùng và AI prompts** được lưu trữ, sử dụng và bảo vệ. **Mọi thành viên đều có trách nhiệm đọc và tuân thủ.**

---

## 1. Phân loại Dữ liệu

| Loại dữ liệu                        | Mức độ nhạy cảm | Nơi lưu                                  | Thời gian giữ                                      |
| -------------------------------------| -----------------| ------------------------------------------| ----------------------------------------------------|
| Thông tin cá nhân (tên, email, SĐT) | 🔴 Rất cao　　　| Postgres – bảng `users`, `profiles`      | Vĩnh viễn (đến khi xóa tài khoản)                  |
| Kinh nghiệm, học vấn, kỹ năng       | 🔴 Rất cao　　　| Postgres – bảng `profiles`               | Vĩnh viễn (đến khi xóa tài khoản)                  |
| Profile embeddings (RAG index)      | 🟠 Cao　　　　　 | Qdrant – collection `profile_embeddings` | Đồng bộ với profile; xóa khi tài khoản bị xóa      |
| CV đã sinh (cv_json)                | 🟠 Cao　　　　　 | Postgres – bảng `cv_generations`         | Vĩnh viễn (đến khi user xóa hoặc tài khoản bị xóa) |
| ATS report & cover letter           | 🟡 Trung bình　　| Postgres – bảng `ats_reports`            | Vĩnh viễn (đến khi user xóa hoặc tài khoản bị xóa) |
| AI Prompts gửi đến LLM              | 🟠 Cao　　　　　 | **Không lưu** – ephemeral                | Không lưu; phụ thuộc chính sách LLM provider       |
| Job listings đã cào                 | 🟢 Thấp　　　　　| Postgres – bảng `jobs`                   | Xóa sau 30 ngày nếu không có application           |
| JWT token                           | 🔴 Rất cao　　　| Client-side only (httpOnly cookie)       | Hết hạn theo `JWT_EXPIRE_MINUTES`                  |

---

## 2. Dữ liệu Profile và CV

### Lưu trữ

- **Postgres** là nơi lưu trữ chính thức cho toàn bộ dữ liệu có cấu trúc.
- **Không lưu file PDF** — pdf-service là stateless, compile trực tiếp và stream về client, không ghi disk.
- **Không lưu file CV gốc (upload)** — mọi CV đều được tái tạo từ `cv_json` + `preferred_template` trong database.

### Quyền truy cập giữa các service

```
profile-service     → ĐỌC/GHI bảng profiles, users
cv-agent-service    → ĐỌC profile qua Qdrant (RAG); GHI bảng cv_generations
ats-agent-service   → ĐỌC cv_generations (qua message); GHI bảng ats_reports
pdf-service         → KHÔNG truy cập DB; nhận cv_data qua HTTP request
scraper-service     → ĐỌC/GHI bảng jobs; ĐỌC application theo user_id
api-gateway         → KHÔNG truy cập DB trực tiếp (proxy và auth check)
```

**Nguyên tắc Least Privilege:** mỗi service chỉ được phép đọc/ghi bảng mà nó sở hữu hoặc được phép tường minh. Không service nào được đọc thẳng bảng của service khác qua DB connection.

### Embeddings trong Qdrant

- Profile embeddings được sinh và upsert bởi `profile-service` sau mỗi lần cập nhật profile.
- Embedding chứa thông tin kỹ năng, kinh nghiệm — **không chứa thông tin định danh** (tên, SĐT, email).
- Khi tài khoản bị xóa: `profile-service` phải xóa embedding tương ứng trong Qdrant theo `user_id`.

---

## 3. AI Prompts & Tương tác LLM

### Dữ liệu gửi đến LLM

| Service | Dữ liệu gửi lên LLM |
|---|---|
| `cv-agent-service` | Profile text (skills, experience, education) + Job description + Feedback ATS (nếu retry) |
| `ats-agent-service` | CV JSON đã sinh + Job description |

**Không bao giờ** gửi lên LLM: email, số điện thoại, địa chỉ nhà, JWT token, API key.

### Chính sách không lưu prompt

- **Prompts không được lưu vào database** dưới bất kỳ hình thức nào.
- Log ở mức `DEBUG` có thể chứa fragment của prompt — **phải tắt DEBUG log trên môi trường production**.
- Giao tiếp với LLM là **ephemeral**: gửi → nhận → dùng kết quả, không persist payload.

### Trách nhiệm với LLM Provider

Hệ thống sử dụng Anthropic (mặc định) hoặc OpenAI qua `libs/llm/adapter`. Cần lưu ý:

- Dữ liệu profile (không có định danh) được gửi đến API bên thứ ba.
- Chính sách data retention của provider áp dụng độc lập với chính sách của dự án này.
- Tham khảo: [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy) | [OpenAI Privacy Policy](https://openai.com/privacy)

### Ví dụ triển khai

```python
# libs/llm/adapter.py
# Prompt được build tại chỗ, gọi API, trả kết quả — không log toàn bộ payload
def call_llm(prompt: str, system: str) -> str:
    """Gọi LLM provider. Không log prompt hoàn chỉnh."""
    response = client.messages.create(...)
    return response.content[0].text  # chỉ lưu kết quả
```

---

## 4. Bảo mật Xác thực & Phân quyền

### JWT

- JWT được ký bằng `JWT_SECRET` (lưu trong `.env`, không commit lên Git).
- `JWT_ALGORITHM=HS256`, hết hạn theo `JWT_EXPIRE_MINUTES` (mặc định 60 phút).
- API Gateway xác thực JWT **trước khi** forward request đến bất kỳ service nào.
- Token chỉ mang `user_id` và `role` — **không mang dữ liệu nhạy cảm** trong payload.

### Cô lập dữ liệu giữa user

Mọi query đến DB phải bao gồm điều kiện `user_id` lấy từ JWT đã verify — **không bao giờ** lấy từ request body hay query param (nguy cơ IDOR).

```python
# Đúng
@router.get("/cvs/{cv_id}")
async def get_cv(cv_id: UUID, current_user: User = Depends(get_current_user)):
    return await cv_service.get_cv(cv_id=cv_id, user_id=current_user.id)

# SAI — không được làm
@router.get("/cvs/{cv_id}")
async def get_cv(cv_id: UUID, user_id: UUID):  # user_id từ request → nguy cơ IDOR
    ...
```

---

## 5. Mật khẩu & Credentials

- **Mật khẩu người dùng** phải được hash bằng **bcrypt** trước khi lưu vào Postgres.
- **Không lưu mật khẩu thuần** ở bất kỳ đâu (log, DB, message queue).
- **API Keys** (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) chỉ đặt trong `.env` — đã có trong `.gitignore`.
- Dùng `detect-secrets` (cấu hình trong `.pre-commit-config.yaml`) để chặn commit chứa secret.

---

## 6. Quyền Người Dùng

| Quyền | Endpoint |
|---|---|
| **Xem** dữ liệu của mình | `GET /profile`, `GET /cvs`, `GET /reports` |
| **Sửa** profile và CV | `PUT /profile`, `PUT /cvs/{id}` |
| **Xóa** CV cụ thể | `DELETE /cvs/{id}` — xóa `cv_generations` + `ats_reports` liên quan |
| **Xóa tài khoản** | `DELETE /users/me` — xóa cascade toàn bộ data + Qdrant embeddings |

Khi implement `DELETE /users/me`: phải xóa Qdrant embeddings theo `user_id` (gọi `profile-service` cleanup hook) **trước** khi xóa DB row để tránh orphan data.

---

## 7. Môi trường & Log

### Log theo môi trường

| Môi trường | Mức log | Ghi chú |
|---|---|---|
| Production | `INFO` | Không log request body có dữ liệu nhạy cảm |
| Staging | `INFO` | Giống production |
| Development | `DEBUG` | Cho phép, nhưng không commit code hardcode log dữ liệu user |

**Không bao giờ log:** password, JWT token, API key, nội dung prompt đầy đủ, email người dùng.

### Biến môi trường

```bash
# .env — không commit, đã gitignore
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
JWT_SECRET=<chuỗi-ngẫu-nhiên-dài-ít-nhất-32-ký-tự>
POSTGRES_PASSWORD=<mật-khẩu-mạnh>
```

- Không dùng giá trị mặc định yếu (`password`, `123456`) trên staging/production.
- Xoay vòng `JWT_SECRET` và DB password định kỳ.

---

## 8. Checklist Bảo mật trước khi Merge

- [ ] `user_id` lấy từ JWT, không lấy từ request body
- [ ] Mật khẩu được hash bằng bcrypt trước khi lưu
- [ ] Không có API key hoặc secret trong code/log
- [ ] Prompt gửi LLM không chứa email, SĐT, địa chỉ
- [ ] Query DB đều có điều kiện `user_id`
- [ ] `pre-commit run --all-files` pass (bao gồm detect-secrets)

---
