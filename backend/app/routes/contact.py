from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.services.firestore_service import FirestoreService

router = APIRouter()


class ContactSubmission(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    topic: str = Field(min_length=2, max_length=120)
    message: str = Field(min_length=10, max_length=5000)


def get_store(request: Request) -> FirestoreService:
    return request.app.state.store


@router.post("/api/contact")
async def create_contact_submission(payload: ContactSubmission, request: Request):
    try:
        submission = await get_store(request).create_contact_submission(
            name=payload.name.strip(),
            email=str(payload.email).strip(),
            topic=payload.topic.strip(),
            message=payload.message.strip(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not save contact submission") from exc
    return {"ok": True, "id": submission["id"]}
