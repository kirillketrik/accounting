from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Asset Management API"
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./asset_management.db"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    seed_on_startup: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
