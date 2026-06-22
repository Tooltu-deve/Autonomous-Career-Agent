# Autonomous Career Agent — Design Doc

**Ngày:** 2026-06-22
**Trạng thái:** Approved (kiến trúc & cấu trúc thư mục)

## 1. Mục tiêu

Nền tảng agentic AI hỗ trợ tìm việc và thiết kế CV, chạy ở môi trường **local**, kiến trúc **microservice**.

Tính năng:
- Login / logout, quản lý profile
- Tự động cào (scrape) job từ LinkedIn / Indeed
- Sinh CV theo từng job description dựa trên user data trong vector database (RAG)
- Chấm điểm & đánh giá CV (ATS), đưa lời khuyên
- Viết cover letter
- Dashboard theo dõi

## 2. Tech stack

| Thành phần | Lựa chọn |
|---|---|
| Backend services | Python / FastAPI |
| Frontend dashboard | Next.js |
| LLM | Cloud API (Claude/OpenAI) qua adapter cấu hình được |
| Vector DB | Qdrant |
| Relational DB | Postgres |
| Messaging | RabbitMQ (event-driven) |
| Orchestration | Docker Compose |

## 3. Phân rã Microservices

| Service | Vai trò | Phụ thuộc |
|---|---|---|
| **api-gateway** | Cổng vào duy nhất, route request, verify JWT | tất cả services |
| **auth-service** | Login/logout, JWT, tài khoản | Postgres |
| **profile-service** | CRUD profile + đẩy user data (JSON) vào Qdrant dạng embedding | Postgres, Qdrant |
| **scraper-service** (Bot) | Cào LinkedIn/Indeed tự động, publish job lên RabbitMQ | RabbitMQ, Postgres |
| **cv-agent-service** (Agent 1 – RAG) | Với mỗi job: lấy user data từ Qdrant + JD → sinh CV JSON | Qdrant, LLM, RabbitMQ |
| **ats-agent-service** (Agent 2 – ATS Audit) | Chấm điểm CV, đánh giá, lời khuyên, cover letter, xuất PDF | LLM, Postgres, RabbitMQ |
| **frontend** (Dashboard) | Giao diện người dùng | api-gateway |

Hạ tầng dùng chung (container): **Postgres**, **Qdrant**, **RabbitMQ**.

## 4. Luồng dữ liệu

```
User → api-gateway → auth (login) → profile-service → [Qdrant: embed user data]
scraper-service (định kỳ) → cào job → RabbitMQ → lưu Postgres
   → cv-agent (RAG: Qdrant + JD) → sinh CV JSON → RabbitMQ
   → ats-agent → chấm điểm + advice + cover letter + PDF → Postgres
Dashboard ← api-gateway ← đọc toàn bộ kết quả
```

Giao tiếp:
- Đồng bộ: client → api-gateway → service qua REST (HTTP).
- Bất đồng bộ: scrape job, sinh CV, chấm điểm chạy nền qua RabbitMQ (event-driven), không block request.

## 5. Cấu trúc thư mục (monorepo)

```
Project/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── Makefile
├── docs/
│   └── superpowers/specs/
├── libs/                       # code Python dùng chung
│   ├── common/                 # config, logging, JWT
│   ├── messaging/              # wrapper RabbitMQ
│   ├── llm/                    # LLM adapter + prompt templates
│   └── schemas/                # Pydantic models dùng chung
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── profile-service/
│   ├── scraper-service/
│   ├── cv-agent-service/
│   └── ats-agent-service/
├── frontend/                   # Next.js
└── infra/                      # init DB, migrations, init Qdrant
```

Mỗi Python service:
```
<service-name>/
├── Dockerfile
├── requirements.txt
├── README.md
├── app/
│   ├── main.py                 # FastAPI app + /health
│   ├── core/                   # config
│   ├── api/                    # routes
│   ├── models/                 # SQLAlchemy (nếu có DB)
│   ├── schemas/                # Pydantic
│   └── services/               # business logic
└── tests/
```

## 6. Quy ước

- **Monorepo** 1 repo cho cả nhóm; `docker-compose up` chạy toàn bộ stack.
- Mỗi service độc lập build/run/test với Dockerfile riêng.
- File `.env` thật KHÔNG commit, chỉ commit `.env.example`.
- Mỗi service expose endpoint `/health`.

## 7. Lưu ý & rủi ro

- **Scraping LinkedIn/Indeed**: vi phạm ToS, có chống bot, dễ bị chặn IP/CAPTCHA. Cần xử lý rate-limit, có thể cần proxy. Cân nhắc dùng API chính thức hoặc dataset mẫu cho mục đích học tập.
- **Chi phí LLM cloud**: theo dõi token; cân nhắc caching kết quả CV/đánh giá.
- **Bảo mật**: JWT secret, API key, DB credentials chỉ qua biến môi trường.

## 8. Phạm vi giai đoạn này

Giai đoạn 1 (tài liệu này): **scaffold cấu trúc thư mục monorepo** + cấu hình hạ tầng (docker-compose, env, skeleton service) để nhóm bắt đầu và push lên git. Logic chi tiết từng service sẽ có spec/plan riêng ở các giai đoạn sau.
