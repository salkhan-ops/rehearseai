from fastapi import APIRouter, Request

router = APIRouter()


async def require_admin_mvp() -> None:
    # TODO: Verify Firebase Admin ID token and require role/custom claim == admin before production.
    return None


@router.get("/api/admin/stats")
async def admin_stats(request: Request):
    await require_admin_mvp()
    return await request.app.state.store.admin_stats()


@router.get("/api/admin/plans")
async def admin_plans(request: Request):
    await require_admin_mvp()
    return await request.app.state.store.admin_list_plans()


@router.post("/api/admin/plans")
async def create_admin_plan(payload: dict, request: Request):
    await require_admin_mvp()
    return await request.app.state.store.admin_save_plan(payload)


@router.put("/api/admin/plans/{plan_id}")
async def update_admin_plan(plan_id: str, payload: dict, request: Request):
    await require_admin_mvp()
    payload["planId"] = plan_id
    return await request.app.state.store.admin_save_plan(payload)


@router.get("/api/admin/users")
async def admin_users(request: Request):
    await require_admin_mvp()
    return await request.app.state.store.admin_list_users()


@router.get("/api/admin/users/{uid}")
async def admin_user(uid: str, request: Request):
    await require_admin_mvp()
    return await request.app.state.store.admin_get_user(uid)


@router.post("/api/admin/users/{uid}/assign-plan")
async def admin_assign_plan(uid: str, payload: dict, request: Request):
    await require_admin_mvp()
    return await request.app.state.store.admin_assign_plan(uid, payload)


@router.post("/api/admin/users/{uid}/make-admin")
async def admin_make_admin(uid: str, request: Request):
    await require_admin_mvp()
    return await request.app.state.store.admin_set_role(uid, "admin")


@router.post("/api/admin/users/{uid}/remove-admin")
async def admin_remove_admin(uid: str, request: Request):
    await require_admin_mvp()
    return await request.app.state.store.admin_set_role(uid, "user")


@router.get("/api/admin/billing")
async def admin_billing(request: Request):
    await require_admin_mvp()
    return await request.app.state.store.admin_billing()


@router.get("/api/admin/entitlements")
async def admin_entitlements(request: Request):
    await require_admin_mvp()
    plans = await request.app.state.store.admin_list_plans()
    return {"plans": plans}
