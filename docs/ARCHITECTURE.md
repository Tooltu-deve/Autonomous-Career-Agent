# System Architecture

Kiến trúc microservice cho **Autonomous Career Agent** — nền tảng AI tự động tìm việc và tạo CV, chạy local qua Docker Compose.

- **Sync (HTTP):** Frontend → API Gateway → các service nghiệp vụ.
- **Async (RabbitMQ):** pipeline `scraper → cv-agent → ats-agent` qua 2 queue.
- **Data:** Postgres (quan hệ) + Qdrant (embedding cho RAG).
- **LLM:** gọi ra ngoài qua `libs/llm/adapter` (Anthropic mặc định `claude-opus-4-8`, hoặc OpenAI).

## Component Diagram

```mermaid
flowchart TB
    User([👤 User])

    subgraph client["Client Layer"]
        FE["🖥️ Frontend<br/>Next.js 14 · :3000"]
    end

    subgraph gateway["Gateway Layer"]
        GW["🚪 API Gateway<br/>FastAPI · :8000"]
    end

    subgraph services["Application Services"]
        AUTH["🔐 auth-service"]
        PROF["👔 profile-service"]
        SCRAPER["🕷️ scraper-service"]
        CV["🤖 cv-agent-service<br/>(RAG)"]
        ATS["📊 ats-agent-service"]
    end

    subgraph messaging["Async Messaging — RabbitMQ :5672 / :15672"]
        Q1{{"queue: jobs.scraped"}}
        Q2{{"queue: cv.generated"}}
    end

    subgraph data["Data Stores"]
        PG[("🐘 Postgres 16 · :5432<br/>users · jobs · ats_reports")]
        QD[("🧠 Qdrant · :6333<br/>profile embeddings")]
    end

    subgraph external["External LLM (libs/llm/adapter)"]
        LLM["✨ Anthropic / OpenAI<br/>default: claude-opus-4-8"]
    end

    %% Sync HTTP flows
    User -->|HTTPS| FE
    FE -->|REST| GW
    GW -->|HTTP| AUTH
    GW -->|HTTP| PROF

    %% Data access
    AUTH --> PG
    PROF --> PG
    PROF -->|embeddings| QD

    %% Async pipeline
    SCRAPER -->|scrape LinkedIn/Indeed<br/>publish| Q1
    SCRAPER --> PG
    Q1 -->|consume| CV
    CV -->|RAG: read profile| QD
    CV -->|LLM call| LLM
    CV -->|publish CV JSON| Q2
    Q2 -->|consume| ATS
    ATS -->|score + cover letter<br/>+ PDF| LLM
    ATS -->|store report| PG

    classDef infra fill:#1f2937,stroke:#4b5563,color:#e5e7eb
    classDef svc fill:#0f766e,stroke:#14b8a6,color:#ecfeff
    classDef queue fill:#7c2d12,stroke:#ea580c,color:#ffedd5
    classDef ext fill:#4c1d95,stroke:#8b5cf6,color:#ede9fe

    class PG,QD infra
    class AUTH,PROF,SCRAPER,CV,ATS,GW svc
    class Q1,Q2 queue
    class LLM ext
```

## Sequence Diagram — End-to-End Flow

Từ lúc người dùng cập nhật hồ sơ đến khi có ATS report hoàn chỉnh.

```mermaid
sequenceDiagram
    autonumber
    actor U as 👤 User
    participant FE as 🖥️ Frontend
    participant GW as 🚪 API Gateway
    participant PROF as 👔 profile-service
    participant QD as 🧠 Qdrant
    participant SCR as 🕷️ scraper-service
    participant MQ as 🐰 RabbitMQ
    participant CV as 🤖 cv-agent-service
    participant ATS as 📊 ats-agent-service
    participant LLM as ✨ LLM (Anthropic/OpenAI)
    participant PG as 🐘 Postgres

    Note over U,QD: Phase 1 — Chuẩn bị hồ sơ (sync)
    U->>FE: Cập nhật profile
    FE->>GW: POST /profile
    GW->>PROF: forward request
    PROF->>PG: lưu profile
    PROF->>QD: upsert embeddings (RAG index)
    PROF-->>FE: 200 OK

    Note over SCR,MQ: Phase 2 — Scrape jobs (async)
    SCR->>SCR: scrape LinkedIn/Indeed
    SCR->>PG: lưu jobs
    SCR->>MQ: publish → jobs.scraped

    Note over MQ,LLM: Phase 3 — Sinh CV bằng RAG
    MQ-->>CV: consume jobs.scraped
    CV->>QD: query profile embeddings (retrieve)
    CV->>LLM: generate CV JSON (job + profile context)
    LLM-->>CV: structured CV
    CV->>MQ: publish → cv.generated

    Note over MQ,PG: Phase 4 — Chấm điểm ATS + cover letter
    MQ-->>ATS: consume cv.generated
    ATS->>LLM: score CV + viết cover letter
    LLM-->>ATS: score + cover letter
    ATS->>ATS: export PDF
    ATS->>PG: lưu ats_reports

    Note over U,PG: Phase 5 — Người dùng xem kết quả
    U->>FE: Xem report
    FE->>GW: GET /reports
    GW-->>FE: ATS report + CV + cover letter PDF
```

## Ghi chú

- **Không có cross-import giữa các service.** Giao tiếp đồng bộ chỉ qua API Gateway; giao tiếp bất đồng bộ chỉ qua RabbitMQ.
- **Queue names** khai báo tập trung tại `libs.messaging.rabbitmq` (`QUEUE_JOBS_SCRAPED`, `QUEUE_CV_GENERATED`).
- **Shared models** (`Job`, `ProfileData`, `GeneratedCV`, `ATSReport`) tại `libs.schemas.models`.
- **Config** duy nhất qua `libs.common.config.settings` — không đọc `os.environ` trực tiếp.
- Mọi service đều expose `GET /health`.
