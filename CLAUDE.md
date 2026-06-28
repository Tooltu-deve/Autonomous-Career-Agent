# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Autonomous Career Agent** — an agentic AI platform for job hunting and CV generation, built as a microservice architecture running locally via Docker Compose.

Core flow:
1. `scraper-service` scrapes jobs from LinkedIn/Indeed → publishes to RabbitMQ queue `jobs.scraped`
2. `cv-agent-service` (RAG) consumes queue → generates structured CV JSON using user profile from Qdrant → publishes to `cv.generated`
3. `ats-agent-service` consumes → scores CV, writes cover letter, exports PDF → stores to Postgres

## Commands

```bash
# Setup
make env          # cp .env.example .env (first time)
make up           # docker compose up -d --build (full stack)
make down         # stop stack
make logs s=<service-name>   # e.g. make logs s=api-gateway
make ps           # container status
make clean        # remove containers + volumes

# Tests (from service directory or via make)
make test                    # runs pytest across all services
cd services/<name> && pytest -q   # single service

# Python linting (from service or libs directory)
black .
ruff check --fix .

# Frontend (from frontend/)
npm run lint
npx prettier --write .
npm run dev    # local dev (port 3000)
```

Service URLs when running:
- API Gateway: http://localhost:8000
- Frontend: http://localhost:3000
- RabbitMQ UI: http://localhost:15672
- Qdrant dashboard: http://localhost:6333/dashboard

## Architecture

**Tech stack:** Python/FastAPI (backend), Next.js 14 App Router (frontend), Qdrant (vector DB), Postgres 16 (relational), RabbitMQ (async messaging), Docker Compose (orchestration).

**LLM layer:** `libs/llm/adapter.py` defines `LLMClient` ABC with `AnthropicClient` and `OpenAIClient` implementations. Switch provider via `settings.llm_provider` (`"anthropic"` | `"openai"`). Default model: `claude-opus-4-8`.

**Shared libraries (`libs/`)** — imported by all services, never cross-imported between services:
- `libs.common.config.settings` — Pydantic `BaseSettings`, single source for all env config; never read `os.environ` directly
- `libs.messaging.rabbitmq` — shared queue names (`QUEUE_JOBS_SCRAPED`, `QUEUE_CV_GENERATED`) and publish/consume interface
- `libs.schemas.models` — shared Pydantic models: `Job`, `ProfileData`, `GeneratedCV`, `ATSReport`
- `libs.llm.adapter` — `get_llm_client()` factory

**Service structure (consistent across all 6 services):**
```
app/
├── main.py      # FastAPI app init + routers; no business logic here
├── core/        # dependencies shared within the service
├── api/         # thin route handlers (validate input, delegate to services/)
├── models/      # SQLAlchemy models
├── schemas/     # Pydantic request/response schemas
└── services/    # business logic
```
Every service exposes `GET /health`.

**Inter-service communication:** HTTP only between services via api-gateway; async jobs via RabbitMQ. No direct cross-service imports.

**Database schema** (`infra/init-db/01_schema.sql`, applied on first Postgres container start): tables `users`, `jobs`, `ats_reports`.

**Qdrant** stores user profile embeddings for RAG in `cv-agent-service` and `profile-service`.

## Code Conventions

Full conventions in [docs/CODING_CONVENTION.md](docs/CODING_CONVENTION.md). Key rules:

- **Python:** Black (line length 88), Ruff for lint + import sort, type hints on all public functions, Pydantic for all API I/O, `snake_case` variables/functions, `PascalCase` classes, `UPPER_SNAKE_CASE` constants
- **TypeScript:** ESLint + Prettier, 2-space indent, no `any`, all API calls go through `lib/api.ts` (not scattered in components), function components only, App Router route folders in `kebab-case`
- **Git:** branch format `<type>/<short-desc>` (e.g. `feat/auth-login`), Conventional Commits (`feat(auth): ...`), PRs require 1 reviewer, no direct push to `main`

## PR Checklist

Before opening a PR: `black .` + `ruff check .` pass, `npm run lint` clean, `pytest` passes, no secrets in diff, commit message follows convention.
