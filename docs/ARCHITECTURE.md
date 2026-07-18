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
        PROF["👔 profile-service<br/>+ preferred_template"]
        SCRAPER["🕷️ scraper-service"]
        CV["🤖 cv-agent-service<br/>(RAG) + CV editor API"]
        ATS["📊 ats-agent-service"]
        PDF["🧾 pdf-service<br/>LaTeX → PDF"]
    end

    subgraph messaging["Async Messaging — RabbitMQ :5672 / :15672"]
        Q1{{"queue: cv.requested<br/>(user_id, job_id, attempt, feedback)"}}
        Q2{{"queue: cv.generated"}}
    end

    subgraph data["Data Stores"]
        PG[("🐘 Postgres 16 · :5432<br/>users · jobs · cvs · ats_reports")]
        QD[("🧠 Qdrant · :6333<br/>profile embeddings")]
    end

    subgraph external["External LLM (libs/llm/adapter)"]
        LLM["✨ Anthropic / OpenAI<br/>default: claude-opus-4-8"]
    end

    %% Sync HTTP flows
    User -->|HTTPS| FE
    FE -->|REST| GW
    GW -->|HTTP| AUTH
    GW -->|"HTTP: /profile"| PROF
    GW -->|"HTTP: POST /jobs/search, /jobs/select"| SCRAPER
    GW -->|"HTTP: GET/PUT /cvs"| CV
    GW -->|"HTTP: GET /reports"| ATS
    GW -->|"HTTP: POST /pdf/export"| PDF

    %% Data access
    AUTH --> PG
    PROF --> PG
    PROF -->|embeddings| QD

    %% Async pipeline (CV generation + scoring loop)
    SCRAPER -->|"scrape LinkedIn/Indeed (on request)"| PG
    SCRAPER -->|"publish selected jobs"| Q1
    Q1 -->|consume| CV
    CV -->|RAG: read profile| QD
    CV -->|"LLM call (+ retry feedback)"| LLM
    CV -->|"store CV draft + read/update"| PG
    CV -->|publish CV JSON| Q2
    Q2 -->|consume| ATS
    ATS -->|score + cover letter| LLM
    ATS -->|"store report + PASS/FAIL"| PG
    ATS -.->|"FAIL: republish + feedback (attempt+1)"| Q1

    classDef infra fill:#1f2937,stroke:#4b5563,color:#e5e7eb
    classDef svc fill:#0f766e,stroke:#14b8a6,color:#ecfeff
    classDef queue fill:#7c2d12,stroke:#ea580c,color:#ffedd5
    classDef ext fill:#4c1d95,stroke:#8b5cf6,color:#ede9fe

    class PG,QD infra
    class AUTH,PROF,SCRAPER,CV,ATS,PDF,GW svc
    class Q1,Q2 queue
    class LLM ext
```

## Sequence Diagram — End-to-End Flow

Từ lúc setup hồ sơ (chọn template) → tìm & chọn job → sinh CV → chấm điểm (có vòng retry) → chỉnh sửa → xuất PDF.

```mermaid
sequenceDiagram
    autonumber
    actor U as 👤 User
    participant FE as 🖥️ Frontend (Tiptap)
    participant GW as 🚪 API Gateway
    participant PROF as 👔 profile-service
    participant QD as 🧠 Qdrant
    participant SCR as 🕷️ scraper-service
    participant MQ as 🐰 RabbitMQ
    participant CV as 🤖 cv-agent-service
    participant ATS as 📊 ats-agent-service
    participant PDF as 🧾 pdf-service
    participant LLM as ✨ LLM (Anthropic/OpenAI)
    participant PG as 🐘 Postgres

    Note over U,QD: Phase 1 — Setup hồ sơ + chọn template (sync)
    U->>FE: Cập nhật profile, chọn preferred_template
    FE->>GW: PUT /profile {..., preferred_template}
    GW->>PROF: forward
    PROF->>PG: lưu profile + preferred_template
    PROF->>QD: upsert embeddings (RAG index)
    PROF-->>FE: 200 OK

    Note over U,PG: Phase 2 — Tìm & chọn job (sync)
    U->>FE: Nhập tiêu chí tìm việc
    FE->>GW: POST /jobs/search {criteria}
    GW->>SCR: forward
    SCR->>SCR: cào LinkedIn/Indeed theo tiêu chí
    SCR->>PG: lưu jobs
    SCR-->>FE: danh sách jobs
    FE-->>U: hiển thị jobs
    U->>FE: tick chọn job → "Tạo CV"
    FE->>GW: POST /jobs/select {job_ids}
    GW->>SCR: forward
    SCR->>MQ: publish → cv.requested (user_id, job_id, attempt=1)

    Note over MQ,PG: Phase 3 — Sinh CV bằng RAG (async)
    MQ-->>CV: consume cv.requested
    CV->>QD: query profile embeddings (retrieve)
    CV->>LLM: generate CV JSON (job + profile [+ feedback nếu retry])
    LLM-->>CV: structured CV
    CV->>PG: upsert cvs (status=draft)
    CV->>MQ: publish → cv.generated

    Note over MQ,PG: Phase 4 — Chấm điểm ATS + cổng PASS/FAIL (async)
    MQ-->>ATS: consume cv.generated
    ATS->>LLM: score CV + viết cover letter
    LLM-->>ATS: score + cover letter
    alt score >= ngưỡng (PASS)
        ATS->>PG: lưu ats_reports (status=PASS)
    else score < ngưỡng (FAIL) và attempt <= max
        ATS->>PG: lưu ats_reports (status=FAIL)
        ATS->>MQ: republish → cv.requested (attempt+1, feedback)
    else quá max lần
        ATS->>PG: lưu ats_reports (status=NEEDS_REVIEW)
    end

    Note over U,PG: Phase 5 — Xem preview & chỉnh sửa CV PASS (sync)
    U->>FE: Mở CV (đã PASS)
    FE->>GW: GET /cvs/{id}
    GW->>CV: forward
    CV->>PG: SELECT cv_data
    PG-->>CV: cvData (JSON)
    CV-->>FE: cvData
    FE-->>U: render preview (template + cvData) + cho sửa
    U->>FE: Sửa xong → Lưu
    FE->>GW: PUT /cvs/{id} {cv_data}
    GW->>CV: forward
    CV->>PG: UPDATE cvs (status=edited)

    Note over U,PDF: Phase 6 — Xuất PDF (sync, stateless)
    U->>FE: Xác nhận "Xuất PDF"
    FE->>GW: POST /pdf/export {template, cv_data}
    GW->>PDF: forward
    Note right of PDF: render .tex từ template + cv_data<br/>compile (tectonic), không lưu file
    PDF-->>FE: application/pdf (stream)
    FE-->>U: tải PDF về
```

## Ghi chú

- **Không có cross-import giữa các service.** Giao tiếp đồng bộ chỉ qua API Gateway; giao tiếp bất đồng bộ chỉ qua RabbitMQ.
- **Queue names** khai báo tập trung tại `libs.messaging.rabbitmq` (`QUEUE_CV_REQUESTED`, `QUEUE_CV_GENERATED`). *(Đổi tên `jobs.scraped` → `cv.requested` vì message giờ mang `user_id, job_id, attempt, feedback`.)*
- **Shared models** (`Job`, `ProfileData`, `GeneratedCV`, `ATSReport`) tại `libs.schemas.models`.
- **Config** duy nhất qua `libs.common.config.settings` — không đọc `os.environ` trực tiếp (vd `ATS_PASS_THRESHOLD`, `ATS_MAX_ATTEMPTS`).
- Mọi service đều expose `GET /health`.
- **`scraper-service` sở hữu bảng `jobs`**: (1) **API đồng bộ** `POST /jobs/search` (cào theo tiêu chí → trả jobs) và `POST /jobs/select` (publish job user chọn vào `cv.requested`); nó là **producer** của queue `cv.requested`.
- **`ats-agent-service` sở hữu bảng `ats_reports`** và đảm nhiệm: (1) **consumer** nghe `cv.generated` → chấm điểm + cover letter, ghi report với `status = PASS | FAIL | NEEDS_REVIEW`; **FAIL** thì republish `cv.requested` (attempt+1, kèm weaknesses/advice), quá `ATS_MAX_ATTEMPTS` thì `NEEDS_REVIEW`; (2) **read API** `GET /reports`. ats **không** ghi vào bảng `cvs` (tránh ghi chéo bảng).
- **`cv-agent-service` sở hữu bảng `cvs`** và đảm nhiệm hai vai trò: (1) **consumer** nghe `cv.requested` → sinh CV bằng RAG (dùng feedback nếu là retry) → upsert `cvs` (`status=draft`) → publish `cv.generated`; (2) **read/update API** (`GET/PUT /cvs/{id}`) phục vụ CV Editor (`status` chuyển `edited` khi user lưu).
- **`pdf-service` là stateless** — nhận `{template, cv_data}` qua HTTP, compile LaTeX (`.tex`) → PDF và stream về, **không lưu file**. PDF luôn tái tạo được từ `cv_data` (bảng `cvs`) + `preferred_template` (profile).
- **`preferred_template`** (`classic|modern|academic`) là thuộc tính của profile, do `profile-service` quản lý; user chọn lúc setup profile và **cố định** cho CV Editor.
