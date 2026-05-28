from typing import Optional
import firebase_admin
from firebase_admin import auth as firebase_auth
from fastapi import Header, HTTPException


def _ensure_firebase_app() -> None:
    if not firebase_admin._apps:
        firebase_admin.initialize_app()


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
