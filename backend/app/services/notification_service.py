from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

from app.models.course import Notification
from app.utils.timestamps import utc_now_iso


class NotificationService:
    def create_notification(self, user_id: str, notification_type: str, title: str, message: str, action_url: Optional[str] = None) -> Notification:
        return Notification(
            id=str(uuid4()),
            userId=user_id,
            type=notification_type,
            title=title,
            message=message,
            read=False,
            actionUrl=action_url,
            createdAt=utc_now_iso(),
        )

    def create_course_reminders(self, user_id: str, course_id: str, title: str, session_count: int) -> list[Notification]:
        return [
            self.create_notification(
                user_id,
                "course_enrolled",
                "Training path activated",
                f"{title} is ready with {session_count} scheduled missions.",
                f"/course/{course_id}",
            ),
            self.create_notification(
                user_id,
                "upcoming_session",
                "Your reasoning training starts soon",
                "Today’s mission is ready. Start when your practice window opens.",
                f"/course/{course_id}",
            ),
        ]

    def missed_session_followup(self, user_id: str, course_id: str) -> Notification:
        return self.create_notification(
            user_id,
            "missed_session",
            "Resume your training rhythm",
            "You missed a scheduled mission. Resume today and keep your streak alive.",
            f"/course/{course_id}",
        )

    def reminder_time(self, scheduled_date: str, scheduled_time: str, minutes_before: int) -> str:
        try:
            target = datetime.fromisoformat(f"{scheduled_date}T{scheduled_time}:00")
        except ValueError:
            target = datetime.utcnow()
        return (target - timedelta(minutes=minutes_before)).isoformat()
