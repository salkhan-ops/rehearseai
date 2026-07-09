from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from firebase_admin import auth as firebase_auth
from app.config import get_settings
from app.utils.security import _ensure_firebase_app

router = APIRouter()


def _set_firebase_auth_disabled(uid: str, disabled: bool) -> None:
    """Best-effort: mirrors Firestore status onto the actual Firebase Auth account so a
    suspended user is genuinely blocked from signing in again, not just labeled in the
    admin panel. Revokes refresh tokens on disable so an already-open session is cut
    off at its next token refresh instead of staying valid for up to an hour."""
    try:
        _ensure_firebase_app()
        firebase_auth.update_user(uid, disabled=disabled)
        if disabled:
            firebase_auth.revoke_refresh_tokens(uid)
    except firebase_auth.UserNotFoundError:
        pass


def _delete_firebase_auth_user(uid: str) -> None:
    try:
        _ensure_firebase_app()
        firebase_auth.delete_user(uid)
    except firebase_auth.UserNotFoundError:
        pass


def public_only(items: list[dict]) -> list[dict]:
    return [
        item
        for item in items
        if item.get("isPublic", True) and item.get("isActive", True)
    ]


async def require_admin_mvp(request: Request) -> str:
    """Verifies the caller's Firebase ID token and requires role == admin in Firestore.
    Returns the verified admin's uid. Previously a no-op stub -- every /api/admin/* route
    was reachable by anyone who knew the URL, no login required."""
    authorization = request.headers.get("authorization") or ""
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    try:
        _ensure_firebase_app()
        decoded = firebase_auth.verify_id_token(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired session.") from exc
    uid = decoded.get("uid")
    profile = await request.app.state.store.admin_get_user(uid) or {}
    if profile.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return uid


async def log_action(
    request: Request,
    action: str,
    target_type: str,
    target_id: str,
    before: Optional[dict] = None,
    after: Optional[dict] = None,
) -> None:
    await request.app.state.store.log_admin_action(
        "system", action, target_type, target_id, before=before, after=after
    )


@router.get("/api/admin/stats")
async def admin_stats(request: Request):
    await require_admin_mvp(request)
    return await request.app.state.store.admin_stats()


@router.get("/api/admin/bootstrap/status")
async def admin_bootstrap_status(request: Request):
    store = request.app.state.store
    return {
        "adminExists": await store.admin_exists(),
        "firstAdminEmailConfigured": bool(get_settings().first_admin_email),
    }


@router.post("/api/admin/bootstrap/claim")
async def admin_bootstrap_claim(payload: dict, request: Request):
    store = request.app.state.store
    uid = str(payload.get("uid") or "")
    email = str(payload.get("email") or "").lower()
    if not uid:
        raise HTTPException(status_code=400, detail="uid is required")
    settings = get_settings()
    configured_email = (settings.first_admin_email or "").lower()
    if configured_email and email != configured_email:
        raise HTTPException(
            status_code=403, detail="This email is not configured as FIRST_ADMIN_EMAIL."
        )
    if await store.admin_exists():
        raise HTTPException(
            status_code=403,
            detail="An admin already exists. Ask an existing admin to grant access.",
        )
    if store.client:
        store.client.collection("users").document(uid).set(
            {"uid": uid, "email": email, "role": "admin"}, merge=True
        )
    store.admin_users.setdefault(uid, {"uid": uid}).update(
        {"email": email, "role": "admin"}
    )
    await store.admin_assign_plan(
        uid, {"planId": "coach", "status": "active", "source": "admin"}
    )
    await store.log_admin_action(
        uid,
        "bootstrap first admin",
        "user",
        uid,
        after={"uid": uid, "email": email, "role": "admin"},
    )
    return {"uid": uid, "email": email, "role": "admin"}


@router.get("/api/catalog/products")
async def public_products(request: Request):
    return public_only(await request.app.state.store.admin_list_products())


@router.get("/api/catalog/plans")
async def public_plans(request: Request):
    return public_only(await request.app.state.store.admin_list_plans())


@router.get("/api/catalog/practice-templates")
async def public_practice_templates(request: Request):
    return public_only(await request.app.state.store.admin_list_practice_templates())


@router.get("/api/catalog/course-templates")
async def public_course_templates(request: Request):
    return public_only(await request.app.state.store.admin_list_course_templates())


@router.get("/api/public/stats")
async def public_stats(request: Request):
    store = request.app.state.store
    if store.client:
        docs = store.client.collection("users").where("email", "!=", "").stream()
        count = sum(1 for _ in docs)
    else:
        count = len([u for u in store.admin_users.values() if u.get("email")])
    return {"practitionerCount": count}


@router.get("/api/admin/plans")
async def admin_plans(request: Request):
    await require_admin_mvp(request)
    return await request.app.state.store.admin_list_plans()


@router.post("/api/admin/plans")
async def create_admin_plan(payload: dict, request: Request):
    await require_admin_mvp(request)
    saved = await request.app.state.store.admin_save_plan(payload)
    await log_action(request, "create plan", "plan", saved["planId"], after=saved)
    return saved


@router.put("/api/admin/plans/{plan_id}")
async def update_admin_plan(plan_id: str, payload: dict, request: Request):
    await require_admin_mvp(request)
    payload["planId"] = plan_id
    saved = await request.app.state.store.admin_save_plan(payload)
    await log_action(request, "update plan", "plan", plan_id, after=saved)
    return saved


@router.patch("/api/admin/plans/{plan_id}")
async def patch_admin_plan(plan_id: str, payload: dict, request: Request):
    return await update_admin_plan(plan_id, payload, request)


@router.delete("/api/admin/plans/{plan_id}")
async def delete_admin_plan(plan_id: str, request: Request):
    await require_admin_mvp(request)
    result = await request.app.state.store.admin_delete_plan(plan_id)
    await log_action(request, "delete plan", "plan", plan_id, after=result)
    return result


@router.get("/api/admin/users")
async def admin_users(request: Request):
    await require_admin_mvp(request)
    return await request.app.state.store.admin_list_users()


@router.get("/api/admin/users/{uid}")
async def admin_user(uid: str, request: Request):
    await require_admin_mvp(request)
    return await request.app.state.store.admin_get_user(uid)


@router.patch("/api/admin/users/{uid}")
async def admin_update_user(uid: str, payload: dict, request: Request):
    await require_admin_mvp(request)
    before = await request.app.state.store.admin_get_user(uid) or {}
    current = {**before, **payload, "uid": uid}
    if request.app.state.store.client:
        request.app.state.store.client.collection("users").document(uid).set(
            current, merge=True
        )
    request.app.state.store.admin_users.setdefault(uid, {"uid": uid}).update(current)
    new_status = payload.get("status")
    if new_status == "disabled" and before.get("status") != "disabled":
        _set_firebase_auth_disabled(uid, True)
    elif before.get("status") == "disabled" and new_status not in (None, "disabled"):
        _set_firebase_auth_disabled(uid, False)
    await log_action(request, "update user", "user", uid, before=before, after=current)
    return current


@router.post("/api/admin/users/{uid}/assign-plan")
async def admin_assign_plan(uid: str, payload: dict, request: Request):
    await require_admin_mvp(request)
    return await request.app.state.store.admin_assign_plan(uid, payload)


@router.post("/api/admin/users/{uid}/make-admin")
async def admin_make_admin(uid: str, request: Request):
    await require_admin_mvp(request)
    return await request.app.state.store.admin_set_role(uid, "admin")


@router.post("/api/admin/users/{uid}/remove-admin")
async def admin_remove_admin(uid: str, request: Request):
    await require_admin_mvp(request)
    return await request.app.state.store.admin_set_role(uid, "user")


@router.delete("/api/admin/users/{uid}")
async def admin_delete_user(uid: str, request: Request):
    """Full wipe: deletes the Firebase Auth account plus the Firestore profile doc and
    every other collection's data tied to this uid (sessions, reports, courses, billing
    records, etc.), so the person can sign up again from scratch with the same email and
    nothing orphaned is left behind."""
    await require_admin_mvp(request)
    store = request.app.state.store
    before = await store.admin_get_user(uid) or {}
    _delete_firebase_auth_user(uid)
    deleted_counts = await store.admin_delete_user_cascade(uid)
    await log_action(
        request, "delete user", "user", uid, before=before,
        after={"deletedAt": datetime.now(timezone.utc).isoformat(), "deletedCounts": deleted_counts},
    )
    return {"deleted": uid, "deletedCounts": deleted_counts}


@router.get("/api/admin/users/ghosts")
async def detect_ghost_users(request: Request):
    await require_admin_mvp(request)
    store = request.app.state.store
    if store.client:
        docs = list(store.client.collection("users").stream())
        ghost_uids = [doc.id for doc in docs if not doc.to_dict().get("email")]
    else:
        ghost_uids = [uid for uid, u in store.admin_users.items() if not u.get("email")]
    return {"count": len(ghost_uids), "uids": ghost_uids}


@router.delete("/api/admin/users/ghosts")
async def delete_ghost_users(request: Request):
    await require_admin_mvp(request)
    store = request.app.state.store
    deleted = 0
    if store.client:
        docs = list(store.client.collection("users").stream())
        for doc in docs:
            if not doc.to_dict().get("email"):
                doc.reference.delete()
                deleted += 1
    else:
        ghost_uids = [uid for uid, u in store.admin_users.items() if not u.get("email")]
        for uid in ghost_uids:
            store.admin_users.pop(uid, None)
        deleted = len(ghost_uids)
    await log_action(request, "purge ghost sessions", "users", "all", after={"deleted": deleted})
    return {"deleted": deleted}


@router.get("/api/admin/billing")
async def admin_billing(request: Request):
    await require_admin_mvp(request)
    return await request.app.state.store.admin_billing()


@router.get("/api/admin/entitlements")
async def admin_entitlements(request: Request):
    await require_admin_mvp(request)
    plans = await request.app.state.store.admin_list_plans()
    return {"plans": plans}


@router.get("/api/admin/products")
async def admin_products(request: Request):
    await require_admin_mvp(request)
    return await request.app.state.store.admin_list_products()


@router.post("/api/admin/products")
async def create_admin_product(payload: dict, request: Request):
    await require_admin_mvp(request)
    saved = await request.app.state.store.admin_save_product(payload)
    await log_action(
        request, "create product", "product", saved["productId"], after=saved
    )
    return saved


@router.patch("/api/admin/products/{product_id}")
async def update_admin_product(product_id: str, payload: dict, request: Request):
    await require_admin_mvp(request)
    payload["productId"] = product_id
    saved = await request.app.state.store.admin_save_product(payload)
    await log_action(request, "update product", "product", product_id, after=saved)
    return saved


@router.delete("/api/admin/products/{product_id}")
async def delete_admin_product(product_id: str, request: Request):
    await require_admin_mvp(request)
    result = await request.app.state.store.admin_delete_product(product_id)
    await log_action(request, "delete product", "product", product_id, after=result)
    return result


@router.get("/api/admin/practice-templates")
async def admin_practice_templates(request: Request):
    await require_admin_mvp(request)
    return await request.app.state.store.admin_list_practice_templates()


@router.post("/api/admin/practice-templates")
async def create_admin_practice_template(payload: dict, request: Request):
    await require_admin_mvp(request)
    saved = await request.app.state.store.admin_save_practice_template(payload)
    await log_action(
        request, "create template", "practiceTemplate", saved["templateId"], after=saved
    )
    return saved


@router.patch("/api/admin/practice-templates/{template_id}")
async def update_admin_practice_template(
    template_id: str, payload: dict, request: Request
):
    await require_admin_mvp(request)
    payload["templateId"] = template_id
    saved = await request.app.state.store.admin_save_practice_template(payload)
    await log_action(
        request, "update template", "practiceTemplate", template_id, after=saved
    )
    return saved


@router.delete("/api/admin/practice-templates/{template_id}")
async def delete_admin_practice_template(template_id: str, request: Request):
    await require_admin_mvp(request)
    result = await request.app.state.store.admin_delete_practice_template(template_id)
    await log_action(
        request, "delete template", "practiceTemplate", template_id, after=result
    )
    return result


@router.get("/api/admin/course-templates")
async def admin_course_templates(request: Request):
    await require_admin_mvp(request)
    return await request.app.state.store.admin_list_course_templates()


@router.post("/api/admin/course-templates")
async def create_admin_course_template(payload: dict, request: Request):
    await require_admin_mvp(request)
    saved = await request.app.state.store.admin_save_course_template(payload)
    await log_action(
        request, "create template", "courseTemplate", saved["templateId"], after=saved
    )
    return saved


@router.patch("/api/admin/course-templates/{template_id}")
async def update_admin_course_template(
    template_id: str, payload: dict, request: Request
):
    await require_admin_mvp(request)
    payload["templateId"] = template_id
    saved = await request.app.state.store.admin_save_course_template(payload)
    await log_action(
        request, "update template", "courseTemplate", template_id, after=saved
    )
    return saved


@router.delete("/api/admin/course-templates/{template_id}")
async def delete_admin_course_template(template_id: str, request: Request):
    await require_admin_mvp(request)
    result = await request.app.state.store.admin_delete_course_template(template_id)
    await log_action(
        request, "delete template", "courseTemplate", template_id, after=result
    )
    return result


@router.get("/api/admin/logs")
async def admin_logs(request: Request, limit: int = 100):
    await require_admin_mvp(request)
    return await request.app.state.store.admin_list_logs(limit_count=limit)


@router.get("/api/admin/contact-messages")
async def admin_contact_messages(
    request: Request, category: Optional[str] = None, status: Optional[str] = None
):
    await require_admin_mvp(request)
    return await request.app.state.store.list_contact_messages(
        category=category, status=status
    )


@router.post("/api/admin/contact-messages/{message_id}/status")
async def admin_update_contact_message_status(
    message_id: str, payload: dict, request: Request
):
    await require_admin_mvp(request)
    status = payload.get("status")
    if status not in {"new", "in_review", "resolved"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    message = await request.app.state.store.update_contact_message_status(
        message_id, status
    )
    if not message:
        raise HTTPException(status_code=404, detail="Contact message not found")
    return message


@router.get("/api/admin/safety-events")
async def admin_safety_events(
    request: Request,
    category: Optional[str] = None,
    risk_level: Optional[str] = None,
    limit: int = 100,
):
    await require_admin_mvp(request)
    return await request.app.state.store.list_safety_events(
        category=category, risk_level=risk_level, limit_count=limit
    )


@router.get("/api/admin/safety-events/stats")
async def admin_safety_event_stats(request: Request):
    await require_admin_mvp(request)
    return await request.app.state.store.safety_event_stats()
