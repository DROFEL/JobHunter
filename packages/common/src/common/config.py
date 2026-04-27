import json
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    database_url: str = "postgresql+psycopg://appuser:12345678@localhost:5432/appdb"

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_root_user: str = "minioadmin"
    minio_root_password: str = "minioadmin"

    # Kafka
    kafka_bootstrap_servers: str = "localhost:9094"
    scraper_concurrency: int = 10
    applier_concurrency: int = 1

    # OpenRouter AI
    open_router_sk: str = ""
    openrouter_rps: float = 1.0

    # LinkedIn
    linkedin_accounts: list[dict[str, str]] = []

    # Proxy — used for outbound HTTP requests (scraping, etc.)
    proxy: str = ""

    # Observability
    otel_exporter_otlp_endpoint: str = "http://localhost:4317"
    otel_service_name: str = ""
    log_level: str = "INFO"

    @field_validator("linkedin_accounts", mode="before")
    @classmethod
    def _parse_linkedin_accounts(cls, v: object) -> object:
        if isinstance(v, str):
            return json.loads(v)
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
