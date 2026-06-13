from typing import Optional
from pathlib import Path
import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from fastapi import Header, HTTPException
from app.config import get_settings


def _ensure_firebase_app() -> None:
    if not firebase_admin._apps:
        settings = get_settings()
        options = {"projectId": settings.firestore_project_id} if settings.firestore_project_id else None
        if settings.google_application_credentials:
            credential_path = Path(settings.google_application_credentials).expanduser()
            if credential_path.exists():
                firebase_admin.initialize_app(credentials.Certificate(str(credential_path)), options)
                return
        firebase_admin.initialize_app(options=options)


async def get_current_user_id(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    try:
        _ensure_firebase_app()
        decoded = firebase_auth.verify_id_token(token)
        return decoded.get("uid")
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid Firebase token") from exc
