from pathlib import Path

from pydantic import field_validator

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        extra="ignore",
    )

    app_name: str = "Tiffin / Mess Subscription API"
    api_prefix: str = "/api/v1"

    database_url: str = "postgresql://postgres:postgres@localhost:5432/tiffin"

    secret_key: str = "change_this_secret_in_production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    razorpay_webhook_secret: str = "change_this_webhook_secret"
    frontend_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    uploads_dir: str = str(BACKEND_DIR / "uploads")
    meal_cancellation_cutoff_hour: int = 22

    @field_validator("frontend_origins", mode="before")
    @classmethod
    def parse_frontend_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

settings = Settings()
