from datetime import date, datetime, timedelta
from uuid import uuid4

from app.models.course import Course, CourseSession, CourseTemplate, CourseTemplateEnrollmentRequest
from app.models.practice import PracticeScenario


class CourseScheduleService:
    def generate_course_schedule(self, course: Course, template: CourseTemplate, payload: CourseTemplateEnrollmentRequest) -> list[CourseSession]:
        start = self._date(payload.preferredStartDate)
        session_dates = self._session_dates(start, template.durationDays, template.frequency, payload.preferredDays)
        minutes = self._daily_minutes(template.dailyMinutes)
        sessions = []
        for index, scheduled in enumerate(session_dates):
            skill = template.targetSkills[index % len(template.targetSkills)]
            pressure = min(96, 35 + int((index / max(1, len(session_dates) - 1)) * 58))
            practice_type = self._practice_type(template.category, index)
            scenario = PracticeScenario(
                category=practice_type,
                difficulty=payload.difficulty,
                title=f"Day {index + 1}: {skill.title()}",
                topic=f"{template.title}: {skill}",
                setting=self._setting(template.category),
                emotionalContext="The room is realistic, attentive, and increasingly skeptical. You must stay composed and structured.",
                pressureSituation=f"Pressure level {pressure}/100. Expect objections, interruptions, and requests for proof.",
                objective=f"Train {skill} while keeping your response concise and evidence-backed.",
                personalityDynamics="The persona adjusts pressure based on clarity, defensiveness, vagueness, and recovery.",
                optionalNotes=f"Template mission {index + 1} from {template.title}.",
            ).model_dump()
            sessions.append(CourseSession(
                id=str(uuid4()),
                courseId=course.id,
                userId=course.userId,
                scheduledDate=scheduled.isoformat(),
                scheduledTime=payload.preferredTime,
                timezone=payload.timezone,
                completed=False,
                practiceType=practice_type,
                reasoningFocus=skill,
                pressureLevel=pressure,
                durationMinutes=minutes,
                generatedScenario=scenario,
                status="scheduled",
                createdAt=course.createdAt,
            ))
        return sessions

    def _date(self, value: str) -> date:
        try:
            return datetime.fromisoformat(value).date()
        except ValueError:
            return datetime.utcnow().date()

    def _session_dates(self, start: date, duration_days: int, frequency: str, preferred_days: list[int]) -> list[date]:
        daily = frequency == "daily"
        target_count = duration_days if daily else max(1, round(duration_days / 7 * (5 if "5" in frequency else 3)))
        days = preferred_days or ([0, 1, 2, 3, 4, 5, 6] if daily else [0, 2, 4])
        output = []
        cursor = start
        while len(output) < target_count and (cursor - start).days <= duration_days + 14:
            if daily or cursor.weekday() in days:
                output.append(cursor)
            cursor += timedelta(days=1)
        return output

    def _daily_minutes(self, value: str) -> int:
        first = value.split("-")[0].strip()
        return int(first) if first.isdigit() else 20

    def _practice_type(self, category: str, index: int) -> str:
        mapping = {
            "Interview": "Job Interview",
            "Public Speaking": "Presentation / Public Speaking",
            "Difficult Conversations": "Difficult Conversation",
            "Negotiation": "Salary Negotiation",
            "Sales": "Sales Pitch",
            "Panel Discussion": "Panel Discussion",
            "Thesis Defense": "Thesis Defense",
            "Teaching": "Teaching Session",
            "Casual Chat": "Casual Chat",
            "Podcast": "Podcast / Interview Show",
            "Leadership": "Panel Discussion",
            "Reasoning": "Panel Discussion",
            "Long Program": ["Job Interview", "Panel Discussion", "Difficult Conversation", "Salary Negotiation"][index % 4],
        }
        return mapping.get(category, "Job Interview")

    def _setting(self, category: str) -> str:
        settings = {
            "Interview": "You are facing a hiring team that wants evidence, not generic confidence.",
            "Public Speaking": "You are presenting to an audience that asks skeptical questions after your talk.",
            "Reasoning": "You are defending your thinking in a fast-moving decision meeting.",
            "Difficult Conversations": "You must deliver a difficult message to someone who reacts emotionally.",
            "Negotiation": "You are negotiating with a counterpart who challenges your anchor and alternatives.",
            "Sales": "You are pitching to a skeptical buyer who raises realistic objections.",
            "Panel Discussion": "You are speaking with multiple panelists who interrupt and challenge your claims.",
            "Thesis Defense": "You are defending your research before examiners testing methods, assumptions, and limits.",
            "Teaching": "You are teaching a curious audience whose questions test clarity and adaptability.",
            "Casual Chat": "You are having a natural conversation that rewards listening and relevant follow-ups.",
            "Podcast": "You are in a recorded interview where concise stories and thoughtful follow-ups matter.",
            "Leadership": "You are briefing impatient executives who want the answer first.",
            "Long Program": "You are in a rotating high-pressure simulation across professional scenarios.",
        }
        return settings.get(category, "You are in a realistic high-pressure conversation.")
