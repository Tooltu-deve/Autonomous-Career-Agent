# Coding Convention — Autonomous Career Agent

Tài liệu thống nhất phong cách code cho cả nhóm. **Mọi PR phải tuân theo các quy ước này.**

---

## 1. Nguyên tắc chung

- **Ngôn ngữ code & comment:** code và tên biến viết bằng **tiếng Anh**; comment/docstring có thể tiếng Việt nếu giải thích nghiệp vụ.
- **DRY:** logic dùng chung đặt ở `libs/`, không copy-paste giữa các service.
- **Một file một trách nhiệm:** file dài quá ~300 dòng là dấu hiệu nên tách.
- **Không commit secret:** API key, mật khẩu chỉ đặt trong `.env` (đã gitignore). Chỉ commit `.env.example`.
- **Mỗi service độc lập:** không import chéo giữa các service; chỉ giao tiếp qua HTTP (REST) hoặc RabbitMQ.

---

## 2. Python (services + libs)

### Công cụ bắt buộc
| Mục đích | Công cụ | Lệnh |
|---|---|---|
| Format | **Black** | `black .` |
| Lint + import sort | **Ruff** | `ruff check --fix .` |
| Type check | **mypy** (khuyến khích) | `mypy app` |
| Test | **pytest** | `pytest -q` |

- Line length: **88** (mặc định Black).
- Indent: **4 spaces**, không dùng tab.

### Đặt tên
| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| Biến, hàm | `snake_case` | `generate_cv`, `job_id` |
| Class | `PascalCase` | `ATSReport`, `LLMClient` |
| Hằng số | `UPPER_SNAKE_CASE` | `QUEUE_JOBS_SCRAPED` |
| Module/file | `snake_case.py` | `rabbitmq.py` |
| Private | tiền tố `_` | `_build_prompt()` |

### Quy tắc
- **Type hints** cho mọi tham số và giá trị trả về của hàm public.
- **Docstring** ngắn cho module, class, hàm public (kiểu một dòng đủ ý).
- Dùng **Pydantic** cho mọi dữ liệu vào/ra API (request/response, message queue).
- Cấu hình đọc qua `libs.common.config.settings`, **không** đọc `os.environ` trực tiếp.
- Import theo thứ tự: stdlib → third-party → local (`libs`, `app`). Ruff tự sắp.

```python
# Tốt
def generate_cv(profile: ProfileData, job: Job) -> GeneratedCV:
    """Sinh CV cho một job từ user data (RAG)."""
    ...
```

### Cấu trúc một service (đã scaffold sẵn)
```
app/
├── main.py        # khởi tạo FastAPI app + router, KHÔNG chứa business logic
├── core/          # config, dependencies dùng chung
├── api/           # định nghĩa route/endpoint (mỏng, gọi sang services/)
├── models/        # SQLAlchemy models
├── schemas/       # Pydantic request/response
└── services/      # business logic (nơi chứa logic chính)
```
- **Endpoint mỏng:** route chỉ validate input + gọi hàm trong `services/`, không nhồi logic.
- Mọi service expose `GET /health`.

---

## 3. TypeScript / Next.js (frontend)

### Công cụ
| Mục đích | Công cụ | Lệnh |
|---|---|---|
| Lint | **ESLint** (next lint) | `npm run lint` |
| Format | **Prettier** | `npx prettier --write .` |

- Indent: **2 spaces**.
- Luôn dùng **TypeScript**, tránh `any` (dùng type/interface rõ ràng).

### Đặt tên
| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| Component | `PascalCase` | `JobCard`, `CVPreview` |
| File component | `PascalCase.tsx` | `JobCard.tsx` |
| Hook | `useCamelCase` | `useAuth` |
| Biến, hàm | `camelCase` | `fetchJobs` |
| Route folder (App Router) | `kebab-case` | `app/job-list/` |

- Component dùng **function component** + hooks, không dùng class component.
- Gọi API backend qua một lớp `lib/api.ts` (không fetch rải rác trong component).

---

## 4. Git Workflow

### Branch
- `main`: luôn chạy được, **không push trực tiếp**.
- Branch theo tính năng: `<type>/<mô-tả-ngắn>`
  - `feat/auth-login`, `fix/cv-prompt`, `docs/readme`, `chore/docker`

### Commit message (Conventional Commits)
```
<type>(<scope>): <mô tả ngắn>

[thân commit nếu cần giải thích]
```
**type:** `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore`
**scope:** tên service/phần, ví dụ `auth`, `cv-agent`, `frontend`

Ví dụ:
```
feat(auth): thêm endpoint login trả JWT
fix(scraper): xử lý rate-limit khi cào Indeed
```

### Pull Request
- Mở PR vào `main`, **cần ít nhất 1 người review** trước khi merge.
- PR phải: pass test, pass lint, mô tả thay đổi rõ ràng.
- Giữ PR nhỏ, tập trung một mục đích.

---

## 5. Test

- Mỗi service có thư mục `tests/`, dùng `pytest`.
- Tối thiểu mỗi endpoint có 1 test (đã có sẵn `test_health.py` làm mẫu).
- Frontend: ưu tiên test logic ở `lib/` trước UI.
- Không merge code làm fail test.

---

## 6. Checklist trước khi tạo PR

- [ ] `black .` và `ruff check .` không báo lỗi (Python)
- [ ] `npm run lint` sạch (frontend)
- [ ] `pytest` pass
- [ ] Không có secret/`.env` trong diff
- [ ] Commit message đúng quy ước
- [ ] Đã tự review diff của mình
