import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.firestore_service import DEFAULT_PLANS, FirestoreService  # noqa: E402
from app.utils.timestamps import utc_now_iso  # noqa: E402


async def main() -> None:
    load_dotenv(ROOT / ".env")
    load_dotenv(ROOT.parent / ".env")

    store = FirestoreService()
    plans = await store.seed_default_plans()
    print(f"Seeded {len(plans)} plans: {', '.join(plan['planId'] for plan in plans)}")

    first_admin_uid = os.getenv("FIRST_ADMIN_UID", "").strip()
    first_admin_email = os.getenv("FIRST_ADMIN_EMAIL", "").strip()
    if first_admin_uid:
        await store.create_user_profile(first_admin_uid, email=first_admin_email or None)
        await store.admin_set_role(first_admin_uid, "admin")
        coach = next(plan for plan in DEFAULT_PLANS if plan["planId"] == "coach")
        await store.admin_assign_plan(
            first_admin_uid,
            {
                "planId": coach["planId"],
                "status": "active",
                "source": "admin",
                "overrides": {},
            },
        )
        await store.log_admin_action(
            admin_uid="seed-script",
            action="seed_first_admin",
            target_type="user",
            target_id=first_admin_uid,
            before={},
            after={"email": first_admin_email, "role": "admin", "planId": "coach", "seededAt": utc_now_iso()},
        )
        print(f"Seeded first admin: {first_admin_uid}")
    else:
        print("FIRST_ADMIN_UID not set. Skipped first admin seeding.")


if __name__ == "__main__":
    asyncio.run(main())
