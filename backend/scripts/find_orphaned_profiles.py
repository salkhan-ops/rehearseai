"""Diff Firebase Auth accounts against Firestore `users` profiles to find orphans.

Firestore `users` docs are keyed by Firebase Auth uid (see admin.py bootstrap),
so any doc id that isn't a real Auth uid is a profile left behind by a partially
failed signup. Read-only -- makes no writes.

Usage: python backend/scripts/find_orphaned_profiles.py
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.utils.security import _ensure_firebase_app  # noqa: E402
from firebase_admin import auth as firebase_auth  # noqa: E402
from app.services.firestore_service import FirestoreService  # noqa: E402


def list_auth_uids() -> dict:
    _ensure_firebase_app()
    uids = {}
    page = firebase_auth.list_users()
    while page:
        for u in page.users:
            uids[u.uid] = u.email
        page = page.get_next_page()
    return uids


def main() -> None:
    auth_uids = list_auth_uids()
    store = FirestoreService()
    if not store.client:
        print("No Firestore client configured (check FIRESTORE_PROJECT_ID / ADC).")
        return

    docs = list(store.client.collection("users").stream())
    print(f"Firebase Auth accounts: {len(auth_uids)}")
    print(f"Firestore user profiles: {len(docs)}\n")

    orphaned_profiles = []
    for doc in docs:
        if doc.id not in auth_uids:
            orphaned_profiles.append((doc.id, doc.to_dict()))

    auth_without_profile = [
        (uid, email) for uid, email in auth_uids.items()
        if not store.client.collection("users").document(uid).get().exists
    ]

    if orphaned_profiles:
        print(f"Firestore profiles with NO matching Auth account ({len(orphaned_profiles)}):")
        for doc_id, data in orphaned_profiles:
            email = data.get("email", "?")
            created = data.get("createdAt", "?")
            role = data.get("role", "user")
            plan = data.get("planId", "?")
            print(f"  - doc_id={doc_id}  email={email}  createdAt={created}  role={role}  planId={plan}")
    else:
        print("No orphaned Firestore profiles found.")

    if auth_without_profile:
        print(f"\nAuth accounts with NO Firestore profile ({len(auth_without_profile)}):")
        for uid, email in auth_without_profile:
            print(f"  - uid={uid}  email={email}")


if __name__ == "__main__":
    main()
