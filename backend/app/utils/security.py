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


async def require_authenticated_user(authorization: Optional[str] = Header(default=None)) -> str:
    """Strict version — raises 401 when credentials are absent or invalid.
    Use on any endpoint that calls an AI service or writes user data."""
    uid = await get_current_user_id(authorization)
    if not uid:
        raise HTTPException(status_code=401, detail="Authentication required. Please sign in to use this service.")
    return uid


async def require_authenticated_user_claims(authorization: Optional[str] = Header(default=None)) -> dict:
    """Like require_authenticated_user, but returns the full decoded token instead of
    just the uid -- for endpoints that need to distinguish an anonymous guest session
    (token claims include firebase.sign_in_provider == "anonymous") from a real account.
    That claim comes from Firebase's own verified token, not anything client-supplied,
    so it can't be spoofed the way a request body flag could."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required. Please sign in to use this service.")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    try:
        _ensure_firebase_app()
        return firebase_auth.verify_id_token(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid Firebase token") from exc


async def get_current_user_id_or_guest(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    """Like get_current_user_id but falls back to None (guest) when credentials are missing
    or the token cannot be verified. Use only for read-only endpoints that are safe for
    unauthenticated access (e.g. notifications list, which returns an empty list for guests)."""
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    try:
        _ensure_firebase_app()
        decoded = firebase_auth.verify_id_token(token)
        return decoded.get("uid")
    except Exception:
        return None
