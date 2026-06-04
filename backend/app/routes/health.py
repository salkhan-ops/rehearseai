from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
async def health(request: Request) -> dict:
    ai = getattr(request.app.state, "ai", None)
    return {
        "status": "ok",
        "service": "rehearseai-backend",
        "gemini": {
            "configured": bool(getattr(ai, "enabled", False)),
            "roleplayModel": getattr(getattr(ai, "settings", None), "gemini_roleplay_model", None),
            "reportModel": getattr(getattr(ai, "settings", None), "gemini_model", None),
        },
    }
