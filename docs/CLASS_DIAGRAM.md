# Class Diagrams

Class diagram (thiết kế mục tiêu, rút gọn) cho từng component của **Autonomous Career Agent**, bám theo [ARCHITECTURE.md](ARCHITECTURE.md) và spec [CV Editor + LaTeX PDF Export](superpowers/specs/2026-07-18-cv-editor-pdf-latex-design.md).

Mỗi service theo cùng kiến trúc phân tầng: **Router** (`api/`) → **Service** (`services/`, chứa business logic) → **ORM** (`models/`). Các diagram dưới đây chỉ hiển thị class cốt lõi; helper nhỏ được gộp thành method của service.

> **Lưu ý:** code hiện mới ở mức scaffold; đây là thiết kế mục tiêu theo spec.

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

Model dữ liệu dùng chung + LLM client, được mọi service tham chiếu.

```mermaid
classDiagram
    class LLMClient {
        <<abstract>>
        +complete(system, prompt) str
    }
    LLMClient <|-- AnthropicClient
    LLMClient <|-- OpenAIClient

    class ProfileData {
        +user_id
        +skills
        +preferred_template
    }
    class Job {
        +id
        +title
        +description
    }
    class CvRequest {
        +user_id
        +job_id
        +attempt
        +feedback
    }
    class GeneratedCV {
        +id
        +application_id
        +content
        +edit_status
        +model_used
    }
    class CvGenerated {
        +cv_generation_id
    }
    class ATSReport {
        +overall_score
        +score_breakdown
        +cover_letter
    }
```

## 1. api-gateway

Chỉ routing + verify JWT, forward mọi request tới service nghiệp vụ.

```mermaid
classDiagram
    class GatewayApp {
        +route(request)
    }
    class ProxyService {
        +forward(service, request)
    }
    class JWTVerifier {
        +verify(token)
    }
    GatewayApp --> ProxyService
    GatewayApp --> JWTVerifier
```

## 2. auth-service

Đăng ký / đăng nhập / cấp JWT. Sở hữu bảng `users`.

```mermaid
classDiagram
    class AuthRouter {
        +register()
        +login()
    }
    class AuthService {
        +register(email, password)
        +login(email, password)
    }
    class User {
        <<ORM>>
        +id
        +email
        +password_hash
    }
    AuthRouter --> AuthService
    AuthService --> User
```

## 3. profile-service

Lưu hồ sơ + `preferred_template`, index embedding cho RAG.

```mermaid
classDiagram
    class ProfileRouter {
        +upsert_profile()
        +get_profile()
    }
    class ProfileService {
        +save(profile)
        +get(user_id)
    }
    class ProfileORM {
        <<ORM>>
        +user_id
        +preferred_template
    }
    class ProfilePreferencesORM {
        <<ORM>>
        +profile_id
        +target_role
        +preferred_locations
    }
    class QdrantRepository {
        +upsert(vector)
    }
    ProfileRouter --> ProfileService
    ProfileService --> ProfileORM
    ProfileService --> ProfilePreferencesORM
    ProfileService --> QdrantRepository
```

## 4. scraper-service

Tìm/chọn job (sync) và **publish** job đã chọn vào `cv.requested`. Sở hữu bảng `jobs`.

```mermaid
classDiagram
    class JobsRouter {
        +search()
        +select()
    }
    class ScraperService {
        +search(criteria)
        +request_cv(job_ids)
    }
    class Scraper {
        <<abstract>>
        +scrape(criteria)
    }
    Scraper <|-- LinkedInScraper
    Scraper <|-- IndeedScraper
    class JobORM {
        <<ORM>>
        +id
        +title
    }
    class CvRequestPublisher {
        +publish(CvRequest)
    }
    JobsRouter --> ScraperService
    ScraperService --> Scraper
    ScraperService --> JobORM
    ScraperService --> CvRequestPublisher
```

## 5. cv-agent-service

Consumer `cv.requested` → sinh CV (RAG, dùng feedback khi retry) → lưu `cvs` → publish `cv.generated`. Kèm API đọc/sửa CV. Sở hữu bảng `cvs`.

```mermaid
classDiagram
    class CvRequestConsumer {
        +on_message(CvRequest)
    }
    class CvsRouter {
        +get_cv()
        +update_cv()
    }
    class CVAgentService {
        +generate(CvRequest)
        +get_cv(id)
        +update_cv(id, cv_json)
    }
    class CvGenerationORM {
        <<ORM>>
        +id
        +application_id
        +cv_json
        +edit_status
    }
    CvRequestConsumer --> CVAgentService
    CvsRouter --> CVAgentService
    CVAgentService --> CvGenerationORM
    CVAgentService --> LLMClient
```

## 6. ats-agent-service

Consumer `cv.generated`: chấm điểm + cover letter, quyết định PASS/FAIL/NEEDS_REVIEW; FAIL → republish `cv.requested`. Read API `/reports`. Sở hữu bảng `ats_reports`.

```mermaid
classDiagram
    class CvGeneratedConsumer {
        +on_message(CvGenerated)
    }
    class ReportsRouter {
        +get_reports()
    }
    class ATSAgentService {
        +process(GeneratedCV)
        +evaluate(score, attempt) generation_status
        +list_reports(user_id)
    }
    class ATSReportORM {
        <<ORM>>
        +cv_generation_id
        +overall_score
        +cover_letter_text
    }
    CvGeneratedConsumer --> ATSAgentService
    ReportsRouter --> ATSAgentService
    ATSAgentService --> ATSReportORM
    ATSAgentService --> LLMClient
```

## 7. pdf-service

Stateless: nhận `{template, cv_data}` → render `.tex` → compile → stream PDF.

```mermaid
classDiagram
    class PdfRouter {
        +export(template, cv_data)
    }
    class TemplateRenderer {
        +render(template, cv_data) tex
    }
    class LatexCompiler {
        +compile(tex) pdf
    }
    PdfRouter --> TemplateRenderer
    PdfRouter --> LatexCompiler
```

## 8. frontend

Mọi call qua `ApiClient` (→ API Gateway); các page dùng chung client.

```mermaid
classDiagram
    class ApiClient {
        +searchJobs()
        +selectJobs()
        +getCv()
        +updateCv()
        +exportPdf()
    }
    ProfileSetupPage --> ApiClient
    JobSearchPage --> ApiClient
    CvEditorPage --> ApiClient
    DashboardPage --> ApiClient
```
