from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.services.firestore_service import FirestoreService
from app.utils.security import get_current_user_id

router = APIRouter()


class ContactSubmission(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    category: str = Field(min_length=2, max_length=120)
    subject: str = Field(min_length=2, max_length=180)
    message: str = Field(min_length=10, max_length=5000)
    userId: Optional[str] = Field(default=None, max_length=128)


def get_store(request: Request) -> FirestoreService:
    return request.app.state.store


@router.post("/api/contact")
async def create_contact_submission(payload: ContactSubmission, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    try:
        submission = await get_store(request).create_contact_message(
            name=payload.name.strip(),
            email=str(payload.email).strip(),
            category=payload.category.strip(),
            subject=payload.subject.strip(),
            message=payload.message.strip(),
            user_id=current_user_id or payload.userId,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not save contact submission") from exc
    return {"ok": True, "id": submission["id"]}
