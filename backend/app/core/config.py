from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo root .env: backend/app/core/config.py -> core -> app -> backend -> repo root.
# In Docker, only backend/ is in the build context, so this path won't exist there and
# config comes entirely from the container's environment (see docker-compose*.yml env_file).
ROOT_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_ENV_FILE, env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "Asset Management API"
    api_prefix: str = "/api"
    database_url: str = "postgresql+psycopg://accounting:accounting@localhost:5432/accounting"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    seed_on_startup: bool = True

    session_cookie_name: str = "session"
    session_ttl_days: int = 14
    cookie_secure: bool = True
    seed_admin_username: str = "vlad_rak"
    seed_admin_password: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
