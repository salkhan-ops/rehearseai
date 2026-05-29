from app.config import get_settings


class DeepgramService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.enabled = bool(self.settings.deepgram_api_key)

    def proxy_status(self) -> dict:
        return {
            "enabled": self.enabled,
            "provider": "deepgram_proxy" if self.enabled else "mock",
            "wsPath": "/ws/voice/deepgram",
            "reason": "Frontend should use the backend WebSocket proxy. Token grant is disabled for MVP.",
        }
