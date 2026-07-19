-- Schema khởi tạo Postgres (chạy tự động khi container postgres lần đầu lên)
-- Đồng bộ với spec: docs/superpowers/specs/2026-07-18-cv-editor-pdf-latex-design.md
-- Ghi chú: profile embeddings cho RAG nằm ở Qdrant, không lưu ở đây.

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- cho gen_random_uuid()

-- ==========================================
-- ENUMS
-- ==========================================

CREATE TYPE job_source AS ENUM ('linkedin', 'indeed', 'manual');

CREATE TYPE job_status AS ENUM ('active', 'expired', 'closed');

-- Trạng thái pipeline tự động (do các service cập nhật khi CV đi qua từng phase).
-- needs_review = đã hết ATS_MAX_ATTEMPTS mà vẫn dưới ngưỡng; failed = lỗi hệ thống.
CREATE TYPE generation_status AS ENUM (
    'saved',
    'cv_queued',
    'cv_generating',
    'cv_generated',
    'ats_scoring',
    'completed',
    'needs_review',
    'failed'
);

-- Trạng thái theo dõi thủ công (user tự cập nhật trên Dashboard board).
CREATE TYPE pipeline_stage AS ENUM (
    'saved',
    'applied',
    'interview',
    'offer',
    'rejected'
);

-- Trạng thái bản CV do user chỉnh sửa (CV Editor / Tiptap).
CREATE TYPE cv_edit_status AS ENUM ('draft', 'edited');

-- ==========================================
-- TRIGGER dùng chung: tự cập nhật updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- BẢNG DỮ LIỆU
-- ==========================================

-- users (Owned by auth-service)
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    full_name     VARCHAR NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- profiles (Owned by profile-service — Phase 1)
CREATE TABLE profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    headline            VARCHAR,
    summary             TEXT,
    location            VARCHAR,
    phone               VARCHAR,
    github_url          VARCHAR,
    linkedin_url        VARCHAR,
    -- Template CV cố định do user chọn lúc setup, pdf-service render theo giá trị này.
    preferred_template  VARCHAR NOT NULL DEFAULT 'classic'
                        CHECK (preferred_template IN ('classic', 'modern', 'academic')),
    completeness_pct    INT NOT NULL DEFAULT 0,  -- range 0-100
    embedding_synced_at TIMESTAMP,               -- lần upsert Qdrant gần nhất
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- profile_experiences
CREATE TABLE profile_experiences (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title         VARCHAR NOT NULL,
    organization  VARCHAR NOT NULL,
    start_date    DATE,
    end_date      DATE,  -- null = present
    description   TEXT,
    display_order INT NOT NULL DEFAULT 0
);

-- profile_educations
CREATE TABLE profile_educations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school         VARCHAR NOT NULL,
    degree         VARCHAR,
    field_of_study VARCHAR,
    start_date     DATE,
    end_date       DATE,
    description    TEXT,
    display_order  INT NOT NULL DEFAULT 0
);

-- profile_skills
CREATE TABLE profile_skills (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_name VARCHAR NOT NULL,
    UNIQUE (profile_id, skill_name)
);

-- profile_preferences (Owned by profile-service — Phase 1)
CREATE TABLE profile_preferences (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id          UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    target_role         VARCHAR NOT NULL,  -- e.g. Software Engineer, Data Scientist
    expected_salary_min INT,
    expected_salary_max INT,
    currency            VARCHAR DEFAULT 'VND',
    preferred_locations TEXT[],            -- danh sách địa điểm
    remote_preference   VARCHAR,           -- remote | hybrid | onsite
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_profile_prefs_updated BEFORE UPDATE ON profile_preferences
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- jobs (Owned by scraper-service — Phase 2)
CREATE TABLE jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source          job_source NOT NULL,
    external_job_id VARCHAR,             -- id trên LinkedIn/Indeed
    title           VARCHAR NOT NULL,
    url             VARCHAR,
    company         VARCHAR NOT NULL,
    location        VARCHAR,
    description     TEXT NOT NULL,
    posted_at       TIMESTAMP,
    scraped_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    status          job_status NOT NULL DEFAULT 'active',
    expires_at      TIMESTAMP,           -- cho query UPDATE ... WHERE expires_at < now()
    raw_data        JSONB,               -- payload gốc khi cào
    UNIQUE (source, external_job_id)
);
CREATE INDEX idx_jobs_status ON jobs(status);

-- applications (Anchor row per user-job pair)
-- LƯU Ý KIẾN TRÚC: đây là bảng orchestration dùng chung — nhiều service cùng cập nhật
-- `generation_status` khi CV đi qua pipeline (scraper→cv-agent→ats-agent). Đây là NGOẠI LỆ
-- có chủ đích với nguyên tắc single-writer; xem ARCHITECTURE.md.
CREATE TABLE applications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id            UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    generation_status generation_status NOT NULL DEFAULT 'saved',  -- pipeline tự động
    pipeline_stage    pipeline_stage NOT NULL DEFAULT 'saved',     -- tracking thủ công
    attempt           INT NOT NULL DEFAULT 1,   -- số lần sinh CV (vòng retry ATS)
    error_message     TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, job_id)
);
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- cv_generations (Owned by cv-agent-service — Phase 3)
-- 1:1 với application; retry ghi đè (upsert) — chỉ giữ bản CV mới nhất.
CREATE TABLE cv_generations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
    cv_json        JSONB NOT NULL,      -- summary, experience, education, skills
    edit_status    cv_edit_status NOT NULL DEFAULT 'draft',  -- draft | edited (CV Editor)
    model_used     VARCHAR NOT NULL,
    generated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_cv_generations_updated BEFORE UPDATE ON cv_generations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ats_reports (Owned by ats-agent-service — Phase 4, viewed in Phase 5)
-- Không lưu PDF: pdf-service stateless, PDF tái tạo từ cv_json + preferred_template.
CREATE TABLE ats_reports (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_generation_id  UUID NOT NULL UNIQUE REFERENCES cv_generations(id) ON DELETE CASCADE,
    overall_score     INT NOT NULL,        -- range 0-100
    score_breakdown   JSONB NOT NULL,      -- keywords/skills/experience/formatting
    matched_keywords  TEXT[] NOT NULL,
    missing_keywords  TEXT[] NOT NULL,
    recommendations   JSONB NOT NULL,      -- array of {type,title,body}
    cover_letter_text TEXT NOT NULL,
    model_used        VARCHAR NOT NULL,
    generated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
