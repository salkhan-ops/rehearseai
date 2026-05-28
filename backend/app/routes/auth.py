from fastapi import APIRouter

router = APIRouter()


@router.get("/api/auth/me")
async def me():
    # TODO: Verify Firebase ID token with Firebase Admin SDK.
    return {"userId": "guest", "plan": "free"}
