"""Application configuration loaded from environment variables."""

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Voltaris AI"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = Field(default="dev-secret-change-in-production-32chars")
    totp_encryption_key: str = Field(
        default="dev-totp-key-change-in-production!!"
    )

    # Database: local SQLite in the backend directory by default, cross-platform
    database_url: str = Field(
        default_factory=lambda: f"sqlite+aiosqlite:///{(BASE_DIR / 'voltaris.db').as_posix()}"
    )

    frontend_url: str = "http://localhost:5173"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_path: str = str(BASE_DIR / "ml_artifacts" / "phaseguard_model.pkl")
    model_version: str = "phaseguard-rf-1.0"

    email_provider: str = "console"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@voltaris.local"

    session_cookie_name: str = "voltaris_session"
    session_max_age_seconds: int = 86400
    pre_auth_max_age_seconds: int = 300

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
