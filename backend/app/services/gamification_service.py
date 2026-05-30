from typing import Optional

from app.models.course import Achievement, UserProgress
from app.utils.timestamps import utc_now_iso


LEVELS = [
    (1, "Initiate", 0),
    (2, "Focused Speaker", 150),
    (3, "Clear Thinker", 350),
    (4, "Pressure Handler", 650),
    (5, "Strategic Communicator", 1000),
    (6, "Reasoning Athlete", 1450),
    (7, "Executive Presence", 2000),
    (8, "Cognitive Performer", 2700),
    (9, "Pressure Master", 3600),
    (10, "Elite Communicator", 4800),
]

ACHIEVEMENTS = {
    "first_session": ("First Session Completed", "Completed your first structured training session.", "Consistency"),
    "streak_3": ("3-Day Streak", "Trained for three sessions without breaking rhythm.", "Consistency"),
    "streak_7": ("7-Day Streak", "Built a full week of cognitive training consistency.", "Consistency"),
    "streak_30": ("30-Day Streak", "Sustained a serious reasoning fitness habit.", "Consistency"),
    "brutal_survivor": ("Survived Brutal Mode", "Completed a brutal pressure simulation.", "Pressure"),
    "calm_interruption": ("Calm Under Interruption", "Practiced staying structured through interruption.", "Pressure"),
    "logic_clarity": ("Logical Clarity Improved", "Advanced your logical structure training.", "Reasoning"),
    "evidence_based": ("Evidence-Based Answering", "Focused on evidence-backed response habits.", "Reasoning"),
    "concise_streak": ("Concise Answer Streak", "Built sharper answer efficiency.", "Communication"),
    "strong_close": ("Strong Closing Answer", "Practiced closing with confidence and structure.", "Communication"),
    "course_7": ("Completed 7-Day Sprint", "Finished a short pressure sprint.", "Course Completion"),
    "course_30": ("Completed 30-Day Program", "Finished a 30-day cognitive training arc.", "Course Completion"),
    "course_executive": ("Completed Executive Course", "Finished executive communication training.", "Course Completion"),
}


class GamificationService:
    def award_xp(self, progress: UserProgress, amount: int) -> UserProgress:
        progress.xp += amount
        progress.level, progress.levelName = self.update_user_level(progress.xp)
        progress.updatedAt = utc_now_iso()
        return progress

    def update_user_level(self, xp: int) -> tuple[int, str]:
        level = LEVELS[0]
        for candidate in LEVELS:
            if xp >= candidate[2]:
                level = candidate
        return level[0], level[1]

    def next_level_xp(self, xp: int) -> int:
        for _, _, threshold in LEVELS:
            if threshold > xp:
                return threshold
        return LEVELS[-1][2]

    def unlock_achievement(self, user_id: str, key: str, existing: list[str]) -> Optional[Achievement]:
        if key in existing or key not in ACHIEVEMENTS:
            return None
        title, description, category = ACHIEVEMENTS[key]
        return Achievement(
            id=f"{user_id}_{key}",
            userId=user_id,
            achievementKey=key,
            title=title,
            description=description,
            category=category,
            unlockedAt=utc_now_iso(),
        )
