import asyncio
import json
import logging

import websockets
from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from pydantic import BaseModel, Field

router = APIRouter()
logger = logging.getLogger(__name__)


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    voiceId: str | None = Field(default=None, max_length=120)

SUPPORTED_DEEPGRAM_LANGUAGES = {"en", "ar", "ur", "hi", "es", "fr"}


def deepgram_listen_url(language: str = "en") -> str:
    safe_language = language if language in SUPPORTED_DEEPGRAM_LANGUAGES else "en"
    return (
        "wss://api.deepgram.com/v1/listen"
        "?model=nova-3"
        f"&language={safe_language}"
        "&smart_format=true"
        "&interim_results=true"
        "&punctuate=true"
        "&endpointing=1000"
        "&utterance_end_ms=2400"
        "&vad_events=true"
    )


@router.get("/api/voice/deepgram-token")
async def deepgram_token(request: Request):
    return request.app.state.deepgram.proxy_status()


@router.post("/api/voice/tts")
async def synthesize_voice(payload: TTSRequest, request: Request):
    try:
        audio, content_type = await request.app.state.cartesia.synthesize(payload.text, payload.voiceId)
        return Response(content=audio, media_type=content_type)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.warning("Cartesia TTS failed: %s", exc)
        raise HTTPException(status_code=502, detail="Cartesia TTS failed. Browser speech fallback will be used.") from exc


async def connect_to_deepgram(api_key: str, language: str):
    headers = {"Authorization": f"Token {api_key}"}
    try:
        return await websockets.connect(deepgram_listen_url(language), additional_headers=headers)
    except TypeError:
        return await websockets.connect(deepgram_listen_url(language), extra_headers=headers)


@router.websocket("/ws/voice/deepgram")
async def deepgram_voice_proxy(websocket: WebSocket):
    await websocket.accept()
    settings = websocket.app.state.deepgram.settings
    api_key = settings.deepgram_api_key
    if not api_key:
        await websocket.send_json({
            "type": "error",
            "reason": "DEEPGRAM_API_KEY is not configured on the backend.",
        })
        await websocket.close(code=1011)
        return

    deepgram = None
    try:
        language = websocket.query_params.get("language", "en")
        deepgram = await connect_to_deepgram(api_key, language)
        await websocket.send_json({"type": "proxy_ready", "provider": "deepgram", "language": language if language in SUPPORTED_DEEPGRAM_LANGUAGES else "en"})

        async def browser_to_deepgram():
            while True:
                message = await websocket.receive()
                if message.get("type") == "websocket.disconnect":
                    break
                if message.get("bytes") is not None:
                    await deepgram.send(message["bytes"])
                elif message.get("text"):
                    payload = message["text"]
                    try:
                        parsed = json.loads(payload)
                        if parsed.get("type") in {"Finalize", "CloseStream"}:
                            await deepgram.send(payload)
                            continue
                    except json.JSONDecodeError:
                        pass
                    await deepgram.send(payload)

        async def deepgram_to_browser():
            async for transcript in deepgram:
                await websocket.send_text(transcript)

        done, pending = await asyncio.wait(
            [asyncio.create_task(browser_to_deepgram()), asyncio.create_task(deepgram_to_browser())],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
        for task in done:
            task.result()
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.warning("Deepgram voice proxy failed: %s", exc)
        try:
            await websocket.send_json({
                "type": "error",
                "reason": "Deepgram voice proxy failed. Browser fallback will be used.",
            })
        except Exception:
            pass
    finally:
        if deepgram:
            try:
                await deepgram.close()
            except Exception:
                pass
