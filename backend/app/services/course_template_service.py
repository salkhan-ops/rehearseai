from typing import Optional

from app.models.course import CourseTemplate


COURSE_TEMPLATES = [
    CourseTemplate(
        id="interview-pressure-sprint-7",
        title="7-Day Interview Pressure Sprint",
        category="Interview",
        durationDays=7,
        frequency="daily",
        difficulty="Realistic",
        dailyMinutes="15-20",
        targetSkills=["concise thinking", "evidence usage", "follow-up recovery", "confident closing"],
        description="Prepare quickly for upcoming interviews with sharp daily simulations.",
        whoFor="Candidates with interviews in the next one to two weeks.",
        expectedTransformation="Stay clear, calm, and persuasive when challenged.",
        sortOrder=1,
    ),
    CourseTemplate(
        id="public-speaking-confidence-14",
        title="14-Day Public Speaking Confidence Builder",
        category="Public Speaking",
        durationDays=14,
        frequency="daily",
        difficulty="Friendly",
        dailyMinutes="15-25",
        targetSkills=["clarity", "audience handling", "composure", "structured answers"],
        description="Build confidence and audience control through progressive speaking missions.",
        whoFor="People preparing talks, classes, webinars, or team presentations.",
        expectedTransformation="Sound clearer and steadier when attention is on you.",
        sortOrder=2,
    ),
    CourseTemplate(
        id="reasoning-under-pressure-30",
        title="30-Day Reasoning Under Pressure Program",
        category="Reasoning",
        durationDays=30,
        frequency="5 days/week",
        difficulty="Realistic",
        dailyMinutes="20",
        targetSkills=["logical structure", "causal reasoning", "pressure recovery", "evidence-based responses"],
        description="Build stronger reasoning, composure, and answer structure under friction.",
        whoFor="Anyone who wants sharper thinking in live high-stakes conversations.",
        expectedTransformation="Think more cleanly when the room gets difficult.",
        sortOrder=3,
    ),
    CourseTemplate(
        id="difficult-conversations-30",
        title="30-Day Difficult Conversations Program",
        category="Difficult Conversations",
        durationDays=30,
        frequency="5 days/week",
        difficulty="Realistic",
        dailyMinutes="15-20",
        targetSkills=["emotional composure", "directness", "conflict control", "repair after tension"],
        description="Practice conflict, feedback, negotiation, and emotional control.",
        whoFor="Managers, founders, partners, and anyone avoiding hard conversations.",
        expectedTransformation="Say hard things without losing calm or clarity.",
        sortOrder=4,
    ),
    CourseTemplate(
        id="executive-communication-8-week",
        title="8-Week Executive Communication Course",
        category="Leadership",
        durationDays=56,
        frequency="3 sessions/week",
        difficulty="Brutal",
        dailyMinutes="25-30",
        targetSkills=["executive communication", "strategic framing", "brevity", "decision defense"],
        description="Develop concise, strategic, leadership-level communication.",
        whoFor="Operators, managers, founders, and senior ICs moving into higher-stakes rooms.",
        expectedTransformation="Communicate like a strategic operator under scrutiny.",
        sortOrder=5,
    ),
    CourseTemplate(
        id="cognitive-performance-mastery-12-week",
        title="12-Week Cognitive Performance Mastery",
        category="Long Program",
        durationDays=84,
        frequency="3-5 sessions/week",
        difficulty="Brutal",
        dailyMinutes="20-30",
        targetSkills=["reasoning", "pressure handling", "persuasion", "confidence", "interruption recovery"],
        description="A longer program combining reasoning, pressure handling, persuasion, and confidence.",
        whoFor="Users who want a serious long-term cognitive training arc.",
        expectedTransformation="Build durable communication intelligence across multiple pressure arenas.",
        sortOrder=6,
    ),
]


class CourseTemplateService:
    def get_course_templates(self) -> list[CourseTemplate]:
        return sorted([template for template in COURSE_TEMPLATES if template.isActive], key=lambda item: item.sortOrder)

    def get_template(self, template_id: str) -> Optional[CourseTemplate]:
        return next((template for template in COURSE_TEMPLATES if template.id == template_id and template.isActive), None)
