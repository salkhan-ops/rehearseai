from typing import AsyncIterator, Optional

import httpx
from app.config import get_settings


class CartesiaService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.enabled = bool(self.settings.cartesia_api_key)

    async def synthesize(self, text: str, voice_id: Optional[str] = None) -> tuple[bytes, str]:
        if not self.enabled or not self.settings.cartesia_api_key:
            raise RuntimeError("CARTESIA_API_KEY is not configured.")

        payload = {
            "model_id": self.settings.cartesia_model_id,
            "transcript": text.strip()[:4000],
            "voice": {"mode": "id", "id": voice_id or self.settings.cartesia_voice_id},
            "language": "en",
            "output_format": {
                "container": "mp3",
                "bit_rate": 128000,
                "sample_rate": 44100,
            },
            "generation_config": {
                "volume": 1,
                "speed": 0.95,
            },
        }
        headers = {
            "Authorization": f"Bearer {self.settings.cartesia_api_key}",
            "Cartesia-Version": self.settings.cartesia_version,
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post("https://api.cartesia.ai/tts/bytes", headers=headers, json=payload)
            if response.status_code in (401, 403):
                fallback_headers = {
                    "X-API-Key": self.settings.cartesia_api_key,
                    "Cartesia-Version": self.settings.cartesia_version,
                    "Content-Type": "application/json",
                }
                response = await client.post("https://api.cartesia.ai/tts/bytes", headers=fallback_headers, json=payload)
            response.raise_for_status()
            return response.content, response.headers.get("content-type", "audio/mpeg")

    async def synthesize_stream(self, text: str, voice_id: Optional[str] = None) -> AsyncIterator[bytes]:
        if not self.enabled or not self.settings.cartesia_api_key:
            raise RuntimeError("CARTESIA_API_KEY is not configured.")

        payload = {
            "model_id": self.settings.cartesia_model_id,
            "transcript": text.strip()[:4000],
            "voice": {"mode": "id", "id": voice_id or self.settings.cartesia_voice_id},
            "language": "en",
            "output_format": {
                "container": "mp3",
                "bit_rate": 128000,
                "sample_rate": 44100,
            },
            "generation_config": {
                "volume": 1,
                "speed": 0.95,
            },
        }
        headers = {
            "Authorization": f"Bearer {self.settings.cartesia_api_key}",
            "Cartesia-Version": self.settings.cartesia_version,
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=httpx.Timeout(8.0, read=30.0)) as client:
            async with client.stream("POST", "https://api.cartesia.ai/tts/bytes", headers=headers, json=payload) as response:
                if response.status_code in (401, 403):
                    fallback_headers = {
                        "X-API-Key": self.settings.cartesia_api_key,
                        "Cartesia-Version": self.settings.cartesia_version,
                        "Content-Type": "application/json",
                    }
                    async with client.stream("POST", "https://api.cartesia.ai/tts/bytes", headers=fallback_headers, json=payload) as retry_response:
                        retry_response.raise_for_status()
                        async for chunk in retry_response.aiter_bytes(4096):
                            yield chunk
                    return
                response.raise_for_status()
                async for chunk in response.aiter_bytes(4096):
                    yield chunk
