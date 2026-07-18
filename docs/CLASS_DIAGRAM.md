# Class Diagrams

Class diagram (thiết kế mục tiêu) cho từng component của **Autonomous Career Agent**, bám theo [ARCHITECTURE.md](ARCHITECTURE.md) và spec [CV Editor + LaTeX PDF Export](superpowers/specs/2026-07-18-cv-editor-pdf-latex-design.md).

Mỗi service theo cùng kiến trúc phân tầng — các class ánh xạ theo thư mục:

| Tầng (`app/`) | Loại class | Ví dụ |
|---|---|---|
| `models/` | SQLAlchemy entity (ORM) | `User`, `JobORM`, `CvORM` |
| `schemas/` | Pydantic DTO (request/response) | `LoginRequest`, `ExportRequest` |
| `api/` | Router (thin handler) | `AuthRouter`, `CvsRouter` |
| `services/` | Business logic | `AuthService`, `Scorer` |
| `core/` | Dependency dùng chung | `get_db`, `get_current_user` |

> **Lưu ý:** code hiện tại mới ở mức scaffold; các class ở tầng `services/`/`models/` là thiết kế mục tiêu theo spec. Khi implement thật, cập nhật lại diagram cho khớp.

## Mục lục

- [0. Foundation — `libs/`](#0-foundation--libs)
- [1. api-gateway](#1-api-gateway)
- [2. auth-service](#2-auth-service)
- [3. profile-service](#3-profile-service)
- [4. scraper-service](#4-scraper-service)
- [5. cv-agent-service](#5-cv-agent-service)
- [6. ats-agent-service](#6-ats-agent-service)
- [7. pdf-service](#7-pdf-service)
- [8. frontend](#8-frontend)

## 0. Foundation — `libs/`

Nền tảng dùng chung, được tham chiếu bởi mọi service.

```mermaid
classDiagram
    direction LR
    class LLMClient {
        <<abstract>>
        +complete(system, prompt) str
    }
    class AnthropicClient
    class OpenAIClient
    LLMClient <|-- AnthropicClient
    LLMClient <|-- OpenAIClient

    class Settings {
        +llm_provider: str
        +llm_model: str
        +jwt_secret: str
        +ats_pass_threshold: float
        +ats_max_attempts: int
        +database_url: str
    }

    class ProfileData {
        +user_id: str
        +full_name: str
        +skills: list~str~
        +experience: list~dict~
        +preferred_template: str
    }
    class Job {
        +id: str
        +source: str
        +title: str
        +company: str
        +description: str
    }
    class CvRequest {
        +user_id: str
        +job_id: str
        +attempt: int
        +feedback: list~str~
    }
    class GeneratedCV {
        +user_id: str
        +job_id: str
        +content: dict
    }
    class ATSReport {
        +user_id: str
        +job_id: str
        +score: float
        +status: str
        +strengths: list~str~
        +weaknesses: list~str~
        +cover_letter: str
    }
```

## 1. api-gateway

Routing + verify JWT; không có business logic. Mọi router chỉ forward qua `ProxyService`.

```mermaid
classDiagram
    direction LR
    class GatewayApp
    class JWTVerifier {
        +get_current_user() UserClaims
    }
    class ProxyService {
        +client: httpx.AsyncClient
        +forward(service, request) Response
    }
    class AuthRouter
    class ProfileRouter
    class JobsRouter
    class CvsRouter
    class ReportsRouter
    class PdfRouter

    GatewayApp --> AuthRouter
    GatewayApp --> ProfileRouter
    GatewayApp --> JobsRouter
    GatewayApp --> CvsRouter
    GatewayApp --> ReportsRouter
    GatewayApp --> PdfRouter
    AuthRouter --> ProxyService
    ProfileRouter --> ProxyService
    JobsRouter --> ProxyService
    CvsRouter --> ProxyService
    ReportsRouter --> ProxyService
    PdfRouter --> ProxyService
    JobsRouter ..> JWTVerifier
    CvsRouter ..> JWTVerifier
    PdfRouter ..> JWTVerifier
```

## 2. auth-service

Đăng ký / đăng nhập / cấp JWT. Sở hữu bảng `users`.

```mermaid
classDiagram
    direction LR
    class AuthRouter {
        +register(req: RegisterRequest)
        +login(req: LoginRequest)
    }
    class AuthService {
        +register(email, password) UserResponse
        +login(email, password) TokenResponse
    }
    class PasswordHasher {
        +hash(pw) str
        +verify(pw, hash) bool
    }
    class JWTService {
        +create_token(user_id) str
        +decode(token) dict
    }
    class User {
        <<ORM>>
        +id: int
        +email: str
        +password_hash: str
    }
    class RegisterRequest
    class LoginRequest
    class TokenResponse

    AuthRouter --> AuthService
    AuthService --> PasswordHasher
    AuthService --> JWTService
    AuthService --> User
    AuthRouter ..> RegisterRequest
    AuthRouter ..> LoginRequest
    AuthService ..> TokenResponse
```

## 3. profile-service

Lưu hồ sơ + `preferred_template`, index embedding cho RAG.

```mermaid
classDiagram
    direction LR
    class ProfileRouter {
        +upsert_profile(req: ProfileRequest)
        +get_profile(user_id) ProfileResponse
    }
    class ProfileService {
        +save(profile: ProfileData) ProfileResponse
        +get(user_id) ProfileData
    }
    class EmbeddingService {
        +embed(text) list~float~
    }
    class QdrantRepository {
        +upsert(user_id, vector, payload)
        +search(vector, k) list
    }
    class ProfileORM {
        <<ORM>>
        +user_id: int
        +preferred_template: str
    }
    class ProfileRequest {
        +preferred_template: str
    }
    class ProfileResponse

    ProfileRouter --> ProfileService
    ProfileService --> EmbeddingService
    ProfileService --> QdrantRepository
    ProfileService --> ProfileORM
    ProfileService ..> ProfileData
    ProfileRouter ..> ProfileRequest
    ProfileRouter ..> ProfileResponse
```

## 4. scraper-service

API sync tìm/chọn job; **producer** của queue `cv.requested`. Sở hữu bảng `jobs`.

```mermaid
classDiagram
    direction LR
    class JobsRouter {
        +search(req: SearchRequest) list~Job~
        +select(req: SelectRequest)
    }
    class Scraper {
        <<abstract>>
        +scrape(criteria) list~Job~
    }
    class LinkedInScraper
    class IndeedScraper
    Scraper <|-- LinkedInScraper
    Scraper <|-- IndeedScraper

    class ScraperService {
        +search(criteria) list~Job~
        +request_cv(user_id, job_ids)
    }
    class JobRepository {
        <<ORM repo>>
        +save_all(jobs)
        +get(job_id) Job
    }
    class CvRequestPublisher {
        +publish(req: CvRequest)
    }
    class JobORM {
        <<ORM>>
        +id: int
        +source: str
        +title: str
    }
    class SearchRequest
    class SelectRequest

    JobsRouter --> ScraperService
    ScraperService --> Scraper
    ScraperService --> JobRepository
    ScraperService --> CvRequestPublisher
    JobRepository --> JobORM
    CvRequestPublisher ..> CvRequest
    JobsRouter ..> SearchRequest
    JobsRouter ..> SelectRequest
```

> `CvRequestPublisher` đẩy vào queue `cv.requested`.

## 5. cv-agent-service

Consumer `cv.requested` (dùng `feedback` khi retry) → upsert `cvs` → publish `cv.generated`; kèm read/update API cho CV Editor. Sở hữu bảng `cvs`.

```mermaid
classDiagram
    direction LR
    class CvRequestConsumer {
        +on_message(req: CvRequest)
    }
    class CvsRouter {
        +get_cv(id) CvResponse
        +update_cv(id, req: CvUpdateRequest)
    }
    class CVAgentService {
        +generate(req: CvRequest) GeneratedCV
    }
    class RAGRetriever {
        +retrieve(user_id) ProfileData
    }
    class CVGenerator {
        +build_prompt(job, profile, feedback) str
        +generate(...) dict
    }
    class CvPublisher {
        +publish(cv: GeneratedCV)
    }
    class CvRepository {
        <<ORM repo>>
        +upsert(cv) CvORM
        +get(id) CvORM
        +update(id, cv_data)
    }
    class CvORM {
        <<ORM>>
        +id: int
        +cv_data: JSONB
        +status: str
    }
    class CvUpdateRequest
    class CvResponse

    CvRequestConsumer --> CVAgentService
    CvsRouter --> CvRepository
    CVAgentService --> RAGRetriever
    CVAgentService --> CVGenerator
    CVAgentService --> CvRepository
    CVAgentService --> CvPublisher
    CVGenerator --> LLMClient
    CvRepository --> CvORM
    RAGRetriever ..> ProfileData
    CVAgentService ..> GeneratedCV
    CvsRouter ..> CvUpdateRequest
    CvsRouter ..> CvResponse
```

## 6. ats-agent-service

Consumer `cv.generated`: chấm điểm + cover letter + cổng PASS/FAIL/NEEDS_REVIEW; FAIL → republish `cv.requested`. Read API `/reports`. Sở hữu bảng `ats_reports`.

```mermaid
classDiagram
    direction LR
    class CvGeneratedConsumer {
        +on_message(cv: GeneratedCV)
    }
    class ReportsRouter {
        +get_reports(user_id) list~ATSReport~
    }
    class ATSAgentService {
        +process(cv: GeneratedCV) ATSReport
        +list_reports(user_id) list~ATSReport~
    }
    class Scorer {
        +score(cv, jd) float
    }
    class CoverLetterWriter {
        +write(cv, jd) str
    }
    class ScoreGate {
        +evaluate(score, attempt) str
    }
    class CvRequestPublisher {
        +republish(req: CvRequest)
    }
    class ATSReportRepository {
        <<ORM repo>>
        +save(report)
        +find_by_user(user_id) list
    }
    class ATSReportORM {
        <<ORM>>
        +id: int
        +score: float
        +status: str
        +attempt: int
    }

    CvGeneratedConsumer --> ATSAgentService
    ReportsRouter --> ATSAgentService
    ATSAgentService --> Scorer
    ATSAgentService --> CoverLetterWriter
    ATSAgentService --> ScoreGate
    ATSAgentService --> CvRequestPublisher
    ATSAgentService --> ATSReportRepository
    ATSReportRepository --> ATSReportORM
    Scorer --> LLMClient
    CoverLetterWriter --> LLMClient
    CvRequestPublisher ..> CvRequest
    ATSAgentService ..> ATSReport
```

> `ScoreGate` quyết định `PASS | FAIL | NEEDS_REVIEW`; FAIL → `CvRequestPublisher.republish` vào `cv.requested` với `attempt+1` + feedback.

## 7. pdf-service

Stateless: nhận `{template, cv_data}` → render `.tex` → compile (tectonic) → stream PDF.

```mermaid
classDiagram
    direction LR
    class PdfRouter {
        +export(req: ExportRequest) bytes
    }
    class TemplateRenderer {
        +render(template, cv_data) str
        +escape_latex(value) str
    }
    class LatexCompiler {
        +compile(tex) bytes
    }
    class ExportRequest {
        +template: str
        +cv_data: dict
    }

    PdfRouter --> TemplateRenderer
    PdfRouter --> LatexCompiler
    PdfRouter ..> ExportRequest
    TemplateRenderer ..> "classic|modern|academic .tex.j2"
```

## 8. frontend

Next.js/TypeScript không hợp class diagram — model tầng `lib/api.ts` + các page.

```mermaid
classDiagram
    class ApiClient {
        +login(email, pw) Token
        +updateProfile(data) void
        +searchJobs(criteria) Job[]
        +selectJobs(jobIds) void
        +getCv(id) CvData
        +updateCv(id, data) void
        +getReports() ATSReport[]
        +exportPdf(template, cvData) Blob
    }
    class ProfileSetupPage
    class JobSearchPage
    class CvEditorPage
    class DashboardPage
    ProfileSetupPage --> ApiClient
    JobSearchPage --> ApiClient
    CvEditorPage --> ApiClient
    DashboardPage --> ApiClient
```
