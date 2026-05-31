import asyncio
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.firestore_service import FirestoreService
from app.utils.timestamps import utc_now_iso


async def main() -> None:
    store = FirestoreService()
    deleted = await store.cleanup_expired_conversation_telemetry(utc_now_iso())
    print(f"Deleted {deleted} expired conversation telemetry records.")


if __name__ == "__main__":
    asyncio.run(main())
