-- Schema khởi tạo Postgres (chạy tự động khi container postgres lần đầu lên)

CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
    id          SERIAL PRIMARY KEY,
    source      VARCHAR(50),
    title       TEXT,
    company     TEXT,
    location    TEXT,
    description TEXT,
    url         TEXT,
    scraped_at  TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ats_reports (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id),
    job_id      INTEGER REFERENCES jobs(id),
    score       REAL,
    advice      JSONB,
    cover_letter TEXT,
    pdf_path    TEXT,
    created_at  TIMESTAMP DEFAULT now()
);
