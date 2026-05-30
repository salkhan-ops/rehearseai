from datetime import datetime, timedelta, timezone
from math import ceil
from typing import Optional
from uuid import uuid4

from app.models.course import Course, CourseBundle, CourseGenerateRequest, CourseModule, CourseProgress, CourseSession
from app.models.practice import PracticeScenario
from app.utils.timestamps import utc_now_iso


SKILL_TREE = [
    "concise thinking",
    "emotional composure",
    "handling interruptions",
    "persuasion",
    "logical structure",
    "evidence usage",
    "strategic framing",
    "executive communication",
    "negotiation stability",
]


class CourseService:
    def __init__(self, ai=None) -> None:
        self.ai = ai

    async def generate_course(self, payload: CourseGenerateRequest, history: Optional[list[dict]] = None) -> CourseBundle:
        now = utc_now_iso()
        duration_days = self._duration_days(payload)
        session_count = max(5, min(56, ceil(payload.availableHoursPerWeek * duration_days / 7 * 60 / payload.preferredSessionDuration)))
        title = self._title_for(payload)
        target_skills = self.generate_reasoning_curriculum(payload.goal, payload.practiceCategories)
        course_id = str(uuid4())

        course = Course(
            id=course_id,
            userId=payload.userId,
            title=title,
            goal=payload.goal,
            durationDays=duration_days,
            difficulty=payload.difficulty,
            targetSkills=target_skills,
            weeklyHours=payload.availableHoursPerWeek,
            practiceLanguage=payload.practiceLanguage,
            feedbackLanguage=payload.feedbackLanguage,
            createdAt=now,
            updatedAt=now,
        )
        modules = self._modules(course_id, target_skills, now)
        sessions = self._sessions(course_id, payload.userId, payload, target_skills, session_count, duration_days, now)
        progress = CourseProgress(
            id=str(uuid4()),
            userId=payload.userId,
            courseId=course_id,
            completedSessions=0,
            totalSessions=len(sessions),
            streak=0,
            growthMetrics={
                "reasoning": 0,
                "pressureResilience": 0,
                "clarity": 0,
                "composure": 0,
                "estimatedWeeklyHours": payload.availableHoursPerWeek,
            },
            updatedAt=now,
        )
        bundle = CourseBundle(course=course, modules=modules, sessions=sessions, progress=progress)
        if self.ai and hasattr(self.ai, "generate_course_outline"):
            payload = await self.ai.generate_course_outline(bundle.model_dump(), history or [])
            bundle = self._merge_ai_outline(bundle, payload)
        return bundle

    async def generate_daily_training(self, course: Course, day_index: int) -> dict:
        skill = course.targetSkills[day_index % max(1, len(course.targetSkills))]
        return {
            "title": f"Day {day_index + 1}: {skill.title()} Under Pressure",
            "objective": f"Build {skill} while maintaining composure during live pushback.",
            "pressureLevel": min(95, 40 + day_index * 4),
        }

    def adapt_course_difficulty(self, course: Course, progress: CourseProgress) -> str:
        completion = progress.completedSessions / max(1, progress.totalSessions)
        if completion > 0.7:
            return "increase_pressure"
        if progress.streak == 0 and progress.completedSessions > 2:
            return "stabilize_and_rebuild"
        return "continue_progression"

    def generate_reasoning_curriculum(self, goal: str, categories: list[str]) -> list[str]:
        selected = ["logical structure", "evidence usage", "emotional composure", "handling interruptions"]
        goal_lower = goal.lower()
        if "executive" in goal_lower or "leadership" in goal_lower:
            selected.extend(["executive communication", "strategic framing"])
        if "negotiat" in goal_lower or "salary" in goal_lower:
            selected.extend(["negotiation stability", "persuasion"])
        if "public" in goal_lower or "presentation" in goal_lower:
            selected.extend(["concise thinking", "persuasion"])
        if any("Difficult" in category for category in categories):
            selected.append("emotional composure")
        return list(dict.fromkeys(selected + SKILL_TREE[:3]))[:8]

    def _duration_days(self, payload: CourseGenerateRequest) -> int:
        if payload.targetCompletionDate:
            try:
                target = datetime.fromisoformat(payload.targetCompletionDate.replace("Z", "+00:00"))
                today = datetime.now(timezone.utc)
                return max(7, min(90, (target.date() - today.date()).days))
            except ValueError:
                pass
        if payload.availableHoursPerWeek <= 2:
            return 30
        if payload.skillLevel == "advanced":
            return 42
        return 21

    def _title_for(self, payload: CourseGenerateRequest) -> str:
        category = payload.practiceCategories[0] if payload.practiceCategories else "Reasoning"
        if "interview" in category.lower():
            return "Interview Mastery"
        if "presentation" in category.lower():
            return "Public Speaking Under Pressure"
        if "salary" in category.lower():
            return "Negotiation Intelligence"
        if "difficult" in category.lower():
            return "Difficult Conversations"
        return "Thinking Clearly Under Pressure"

    def _modules(self, course_id: str, skills: list[str], now: str) -> list[CourseModule]:
        modules = []
        for index, skill in enumerate(skills[:4]):
            modules.append(CourseModule(
                id=str(uuid4()),
                courseId=course_id,
                title=f"{skill.title()} Block",
                objective=f"Develop {skill} through progressively harder pressure simulations.",
                order=index + 1,
                createdAt=now,
            ))
        return modules

    def _sessions(self, course_id: str, user_id: str, payload: CourseGenerateRequest, skills: list[str], count: int, duration_days: int, now: str) -> list[CourseSession]:
        today = datetime.now(timezone.utc).date()
        step = max(1, duration_days // max(1, count))
        sessions = []
        for index in range(count):
            practice_type = payload.practiceCategories[index % len(payload.practiceCategories)]
            skill = skills[index % len(skills)]
            pressure = min(95, 35 + int((index / max(1, count - 1)) * 55))
            scenario = PracticeScenario(
                category=practice_type,
                difficulty=payload.difficulty,
                title=f"{skill.title()} Mission",
                topic=f"{practice_type}: {payload.goal}",
                setting=self._setting(practice_type, payload.targetRole),
                emotionalContext="The room is attentive but increasingly skeptical. Your task is to stay precise without becoming defensive.",
                pressureSituation=f"Pressure level {pressure}/100. Expect follow-up questions, interruptions, and requests for evidence.",
                objective=f"Practice {skill} while keeping answers concise, evidence-backed, and calm.",
                personalityDynamics="The AI persona adapts: supportive at first, sharper when answers become vague, and calmer if emotional overload appears.",
                optionalNotes=f"Course mission {index + 1}. Focus on {skill}.",
            ).model_dump()
            sessions.append(CourseSession(
                id=str(uuid4()),
                courseId=course_id,
                userId=user_id,
                scheduledDate=(today + timedelta(days=index * step)).isoformat(),
                completed=False,
                practiceType=practice_type,
                reasoningFocus=skill,
                pressureLevel=pressure,
                durationMinutes=payload.preferredSessionDuration,
                generatedScenario=scenario,
                createdAt=now,
            ))
        return sessions

    def _setting(self, practice_type: str, target_role: Optional[str]) -> str:
        role = target_role or "your target role"
        settings = {
            "Job Interview": f"You are in a final-round interview for {role}. The interviewer is testing whether your reasoning holds under scrutiny.",
            "Presentation / Public Speaking": "You are presenting to a skeptical leadership group after mixed results.",
            "Panel Discussion": "You are on a live panel where multiple people challenge your assumptions.",
            "Thesis Defense": "An examiner asks whether your method can support your central claim.",
            "Salary Negotiation": "A budget-conscious manager pushes back on your compensation request.",
            "Difficult Conversation": "A respected colleague reacts emotionally to a decision you need to communicate.",
            "Teaching Session": "A group of learners is confused and asks increasingly specific questions.",
            "Sales Pitch": "A potential buyer believes your solution is overpriced and risky.",
        }
        return settings.get(practice_type, "You are in a high-stakes conversation where clarity and composure matter.")

    def _merge_ai_outline(self, bundle: CourseBundle, payload: dict) -> CourseBundle:
        try:
            course_payload = payload.get("course", {})
            if isinstance(course_payload.get("title"), str):
                bundle.course.title = course_payload["title"][:140]
            if isinstance(course_payload.get("targetSkills"), list) and course_payload["targetSkills"]:
                bundle.course.targetSkills = [str(skill)[:80] for skill in course_payload["targetSkills"][:9]]

            module_payloads = payload.get("modules", [])
            if isinstance(module_payloads, list):
                for module, next_module in zip(bundle.modules, module_payloads):
                    if isinstance(next_module, dict):
                        if isinstance(next_module.get("title"), str):
                            module.title = next_module["title"][:140]
                        if isinstance(next_module.get("objective"), str):
                            module.objective = next_module["objective"][:300]

            session_payloads = payload.get("sessions", [])
            if isinstance(session_payloads, list):
                for session, next_session in zip(bundle.sessions, session_payloads):
                    if not isinstance(next_session, dict):
                        continue
                    if isinstance(next_session.get("reasoningFocus"), str):
                        session.reasoningFocus = next_session["reasoningFocus"][:100]
                    if isinstance(next_session.get("pressureLevel"), int):
                        session.pressureLevel = max(0, min(100, next_session["pressureLevel"]))
                    scenario = next_session.get("generatedScenario")
                    if isinstance(scenario, dict):
                        session.generatedScenario = {**session.generatedScenario, **{key: value for key, value in scenario.items() if isinstance(value, str)}}
        except Exception:
            return bundle
        return bundle
