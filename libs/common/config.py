"""Cấu hình dùng chung cho mọi service, đọc từ biến môi trường."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LLM
    llm_provider: str = "anthropic"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    llm_model: str = "claude-opus-4-8"

    # Apify (scraper-service)
    apify_api_token: str = ""

    # ATS retry gate
    ats_pass_threshold: float = 70
    ats_max_attempts: int = 3

    # Logging
    log_level: str = "INFO"

    # Auth
    jwt_secret: str = "change_me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # Postgres
    postgres_user: str = "career"
    postgres_password: str = "career_pass"
    postgres_db: str = "career_db"
    postgres_host: str = "postgres"
    postgres_port: int = 5432

    # RabbitMQ
    rabbitmq_host: str = "rabbitmq"
    rabbitmq_port: int = 5672
    rabbitmq_user: str = "guest"
    rabbitmq_password: str = "guest"

    # API Gateway — các origin của frontend cho CORS (phân tách bằng dấu phẩy).
    # Cần cả localhost lẫn 127.0.0.1 vì browser coi đây là hai origin khác nhau.
    frontend_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def frontend_origin_list(self) -> list[str]:
        return [o.strip() for o in self.frontend_origins.split(",") if o.strip()]

    # API Gateway — URL downstream service (mặc định = tên service trong docker-compose)
    auth_service_url: str = "http://auth-service:8000"
    profile_service_url: str = "http://profile-service:8000"
    scraper_service_url: str = "http://scraper-service:8000"
    cv_service_url: str = "http://cv-agent-service:8000"
    ats_service_url: str = "http://ats-agent-service:8000"
    pdf_service_url: str = "http://pdf-service:8000"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
