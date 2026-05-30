from datetime import datetime, timedelta
from zoneinfo import ZoneInfo


class ReminderService:
    """Cron-ready reminder architecture.

    MVP sends browser reminders from the frontend. This service centralizes schedule
    calculations for future Google Cloud Scheduler, email, and push workers.
    """

    def next_reminder_at(self, schedule: dict) -> str:
        timezone = schedule.get("timezone") or "UTC"
        now = datetime.now(ZoneInfo(timezone))
        hour, minute = [int(part) for part in schedule.get("preferredTime", "20:00").split(":")]
        target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if target <= now:
            target += timedelta(days=1)
        target -= timedelta(minutes=int(schedule.get("reminderMinutesBefore", 15)))
        return target.isoformat()

    def notification_copy(self, schedule: dict, challenge: dict | None = None) -> dict:
        categories = schedule.get("categories") or ["pressure training"]
        category = categories[0]
        return {
            "title": "Your pressure training session starts soon.",
            "body": challenge.get("title") if challenge else f"Time for your {category} simulation.",
            "actions": ["quick_start", "snooze", "skip_today"],
        }
