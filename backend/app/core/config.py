from pathlib import Path
from typing import Any

from pydantic import AliasChoices, Field, field_validator
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
    frontend_origins: list[str] | str = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        validation_alias=AliasChoices("FRONTEND_ORIGINS", "FRONTEND_ORIGIN"),
    )
    uploads_dir: str = str(BACKEND_DIR / "uploads")
    meal_cancellation_cutoff_hour: int = 22

    otp_code_length: int = 6
    otp_expiry_minutes: int = 10
    otp_resend_after_seconds: int = 60
    otp_max_attempts: int = 5

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_use_tls: bool = True

    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_from_number: str | None = None

    @field_validator("frontend_origins", mode="before")
    @classmethod
    def parse_frontend_origins(cls, value: Any):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

settings = Settings()
