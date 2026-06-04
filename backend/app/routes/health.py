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


@router.get("/health/gemini")
async def gemini_health(request: Request) -> dict:
    ai = getattr(request.app.state, "ai", None)
    if not ai:
        return {"configured": False, "ok": False, "reason": "AI service is unavailable"}
    return await ai.check_access()
