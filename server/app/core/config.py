from pathlib import Path

try:
    from pydantic_settings import BaseSettings
    from pydantic import Field
except ImportError:
    from pydantic.v1 import BaseSettings, Field


class Settings(BaseSettings):
    app_env: str = "local"
    database_path: Path = Field(default=Path("data/startupsage.db"))
    seed_data_path: Path = Field(default=Path("data/failed_startups_seed.json"))
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    elevenlabs_api_key: str | None = None
    cors_origin_csv: str = "http://localhost:3000,http://localhost:5173,http://localhost:8080,http://localhost:5858,http://127.0.0.1:5858"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origin_csv.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
