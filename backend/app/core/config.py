from pathlib import Path

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
    frontend_origin: str = "http://localhost:5173"

settings = Settings()
