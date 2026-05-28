from typing import Optional
from pydantic import BaseModel


class User(BaseModel):
    id: str
    email: Optional[str] = None
    displayName: Optional[str] = None
    plan: str = "free"
    createdAt: str
    updatedAt: str
