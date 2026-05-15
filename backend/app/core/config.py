from functools import lru_cache
from typing import Self
from urllib.parse import quote_plus

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Load from environment (Docker `env_file: .env`, Render, shell, …)."""

    model_config = SettingsConfigDict(extra="ignore", case_sensitive=False)

    # Either set a full SQLAlchemy URL, or set POSTGRES_* below and the URL is built.
    DATABASE_URL: str = Field(default="", description="postgresql+psycopg2://…")

    POSTGRES_HOST: str = "127.0.0.1"
    POSTGRES_PORT: int = 5433
    POSTGRES_USER: str = "hirekaar"
    POSTGRES_PASSWORD: str = "hirekaar"
    POSTGRES_DB: str = "hirekaar"

    JWT_SECRET: str = "change-me-use-openssl-rand-hex-32"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    PLATFORM_FEE_RATE: float = 0.10
    BOOST_PRICE_PER_DAY_MINOR: int = 500
    CORS_ORIGINS: str = "http://localhost:3000"

    @model_validator(mode="after")
    def assemble_database_url(self) -> Self:
        explicit = (self.DATABASE_URL or "").strip()
        if explicit:
            object.__setattr__(self, "DATABASE_URL", explicit)
            return self
        built = (
            f"postgresql+psycopg2://{quote_plus(self.POSTGRES_USER)}:{quote_plus(self.POSTGRES_PASSWORD)}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
        object.__setattr__(self, "DATABASE_URL", built)
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
