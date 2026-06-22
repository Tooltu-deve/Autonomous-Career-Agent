# Autonomous Career Agent

Nền tảng agentic AI hỗ trợ **tìm việc** và **thiết kế CV**, chạy local theo kiến trúc **microservice**.

## Tính năng

- Login / logout, quản lý profile
- Tự động cào job từ LinkedIn / Indeed (Bot)
- **Agent 1 (RAG):** sinh CV theo từng job description từ user data trong vector DB
- **Agent 2 (ATS Audit):** chấm điểm CV, đánh giá, lời khuyên, cover letter, xuất PDF
- Dashboard theo dõi

## Kiến trúc

```
User → api-gateway → auth / profile-service → [Qdrant: embed user data]
scraper-service → cào job → RabbitMQ → Postgres
   → cv-agent (RAG) → sinh CV JSON → RabbitMQ
   → ats-agent → chấm điểm + cover letter + PDF → Postgres
Dashboard ← api-gateway
```

| Thành phần | Công nghệ |
|---|---|
| Backend services | Python / FastAPI |
| Frontend | Next.js |
| LLM | Cloud API (Claude/OpenAI) |
| Vector DB | Qdrant |
| Relational DB | Postgres |
| Messaging | RabbitMQ |
| Orchestration | Docker Compose |

Chi tiết thiết kế: [docs/superpowers/specs/2026-06-22-job-cv-agentic-platform-design.md](docs/superpowers/specs/2026-06-22-job-cv-agentic-platform-design.md)

## Cấu trúc thư mục

```
services/          # 6 microservice FastAPI
  api-gateway/     auth-service/      profile-service/
  scraper-service/ cv-agent-service/  ats-agent-service/
frontend/          # Next.js dashboard
libs/              # code Python dùng chung (common, messaging, llm, schemas)
infra/             # init DB, migrations
docs/              # tài liệu
```

## Bắt đầu

```bash
# 1. Tạo file .env từ mẫu rồi điền API key
make env          # hoặc: cp .env.example .env

# 2. Lên toàn bộ stack
make up

# 3. Kiểm tra
make ps
make logs s=api-gateway
```

| Service | URL |
|---|---|
| API Gateway | http://localhost:8000 |
| Frontend | http://localhost:3000 |
| RabbitMQ UI | http://localhost:15672 |
| Qdrant | http://localhost:6333/dashboard |

## Quy trình nhóm

- Mỗi service phát triển độc lập trong thư mục riêng.
- File `.env` thật **không** commit (đã trong `.gitignore`).
- Tạo branch theo tính năng, mở Pull Request để review trước khi merge `main`.
