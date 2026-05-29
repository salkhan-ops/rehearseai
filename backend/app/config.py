from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RehearseAI"
    cors_origins: str = "http://localhost:3000"
    google_cloud_project: Optional[str] = None
    google_application_credentials: Optional[str] = None
    gemini_api_key: Optional[str] = None
    deepgram_api_key: Optional[str] = None
    cartesia_api_key: Optional[str] = None
    cartesia_voice_id: str = "a0e99841-438c-4a64-b679-ae501e7d6091"
    cartesia_model_id: str = "sonic-3"
    cartesia_version: str = "2026-03-01"
    gemini_model: str = "gemini-2.5-flash"
    gemini_roleplay_model: str = "gemini-2.5-flash-lite"
    ai_history_messages: int = 8
    ai_roleplay_max_output_tokens: int = 180
    ai_report_max_output_tokens: int = 900
    ai_temperature: float = 0.65
    firestore_project_id: Optional[str] = None
    paddle_api_key: Optional[str] = None
    paddle_webhook_secret: Optional[str] = None
    paddle_pro_price_id: Optional[str] = None
    paddle_coach_price_id: Optional[str] = None
    paddle_environment: str = "sandbox"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
