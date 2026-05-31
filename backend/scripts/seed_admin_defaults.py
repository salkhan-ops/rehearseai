import asyncio
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.firestore_service import (  # noqa: E402
    DEFAULT_COURSE_TEMPLATES,
    DEFAULT_PLANS,
    DEFAULT_PRACTICE_TEMPLATES,
    DEFAULT_PRODUCTS,
    FirestoreService,
)


async def main() -> None:
    store = FirestoreService()
    for plan in DEFAULT_PLANS:
        await store.admin_save_plan({**plan})
    for product in DEFAULT_PRODUCTS:
        await store.admin_save_product({**product})
    for template in DEFAULT_PRACTICE_TEMPLATES:
        await store.admin_save_practice_template({**template})
    for template in DEFAULT_COURSE_TEMPLATES:
        await store.admin_save_course_template({**template})

    first_admin_uid = os.environ.get("FIRST_ADMIN_UID", "")
    first_admin_email = os.environ.get("FIRST_ADMIN_EMAIL", "")
    if first_admin_uid:
        await store.admin_set_role(first_admin_uid, "admin")
        if first_admin_email:
            if store.client:
                store.client.collection("users").document(first_admin_uid).set({"email": first_admin_email}, merge=True)
            store.admin_users.setdefault(first_admin_uid, {"uid": first_admin_uid}).update({"email": first_admin_email})
        await store.admin_assign_plan(first_admin_uid, {"planId": "coach", "status": "active", "source": "admin"})

    print("Seeded admin defaults: plans, products, practice templates, course templates.")


if __name__ == "__main__":
    asyncio.run(main())
