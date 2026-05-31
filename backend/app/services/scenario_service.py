import json
import random
import re
from typing import Optional

from app.models.practice import PracticeScenario, ScenarioRequest


FALLBACK_SCENARIOS = {
    "Job Interview": [
        "You are interviewing for a product manager role at a fast-growing AI startup. The interviewer believes your previous experience is too academic.",
        "You are in a final-round interview with a skeptical VP who wants proof that you can make tradeoffs under ambiguity.",
    ],
    "Presentation / Public Speaking": [
        "You are presenting quarterly results to skeptical executives after a disappointing quarter.",
        "You are explaining a new strategy to a team that worries the plan is too vague and risky.",
    ],
    "Panel Discussion": [
        "You are on a live panel where another speaker keeps interrupting and challenging your assumptions.",
    ],
    "Thesis Defense": [
        "An examiner questions whether your methodology can establish causality.",
    ],
    "Salary Negotiation": [
        "You received an offer lower than expected and must negotiate without sounding aggressive.",
    ],
    "Difficult Conversation": [
        "You must explain to a senior colleague why their project proposal will not move forward.",
    ],
    "Teaching Session": [
        "You are teaching a complex idea to students who are curious but confused and impatient.",
    ],
    "Sales Pitch": [
        "A potential client thinks your solution is overpriced and not urgent.",
    ],
}

DAILY_CHALLENGES = [
    ("Handling interruption", "Give a concise answer after being interrupted without sounding defensive."),
    ("Concise reasoning", "Answer with one clear claim, one evidence point, and one implication."),
    ("Emotional composure", "Respond calmly to a skeptical or disappointed person."),
    ("Skeptical questioning", "Defend a recommendation when the listener doubts your assumptions."),
    ("Persuasive framing", "Turn a broad idea into a decision-ready recommendation."),
]


class ScenarioService:
    def __init__(self, ai=None) -> None:
        self.ai = ai

    async def generate_random_scenario(self, request: ScenarioRequest, user_history: Optional[list[dict]] = None) -> PracticeScenario:
        if self.ai and getattr(self.ai, "enabled", False) and getattr(self.ai, "report_model", None):
            try:
                response = await self.ai.report_model.generate_content_async(
                    self._prompt(request, user_history or []),
                    generation_config={"temperature": 0.8, "max_output_tokens": 650, "response_mime_type": "application/json"},
                )
                parsed = self._parse_json(response.text or "")
                return PracticeScenario(category=request.category, difficulty=request.difficulty, **parsed)
            except Exception:
                pass
        return self._fallback(request)

    async def generate_daily_challenge(self, user_id: str, category: Optional[str] = None) -> dict:
        title, objective = DAILY_CHALLENGES[hash(f"{user_id}") % len(DAILY_CHALLENGES)]
        selected_category = category or random.choice(list(FALLBACK_SCENARIOS.keys()))
        scenario = await self.generate_random_scenario(ScenarioRequest(userId=user_id, category=selected_category, difficulty="Intermediate"))
        return {
            "title": f"Today's Cognitive Challenge: {title}",
            "objective": objective,
            "scenario": scenario.model_dump(),
        }

    async def generate_progressive_difficulty_scenario(self, request: ScenarioRequest, user_history: Optional[list[dict]] = None) -> PracticeScenario:
        sessions = len(user_history or [])
        if sessions >= 8:
            request.difficulty = "Brutal"
        elif sessions >= 3:
            request.difficulty = "Advanced"
        else:
            request.difficulty = "Beginner"
        return await self.generate_random_scenario(request, user_history)

    def _fallback(self, request: ScenarioRequest) -> PracticeScenario:
        prompt = random.choice(FALLBACK_SCENARIOS[request.category])
        return PracticeScenario(
            category=request.category,
            difficulty=request.difficulty,
            title=f"{request.category} pressure drill",
            topic=prompt.split(".")[0][:150],
            setting=prompt,
            emotionalContext="The room is professional, but there is visible skepticism and limited patience.",
            pressureSituation="The other person asks for evidence, interrupts once, and challenges vague claims.",
            objective="Stay calm, concise, specific, and evidence-backed under pressure.",
            personalityDynamics="The AI persona is fair but skeptical, pushing for sharper reasoning without becoming abusive.",
            optionalNotes="Increase pressure if the user becomes generic. Soften if the user appears overwhelmed.",
        )

    def _prompt(self, request: ScenarioRequest, user_history: list[dict]) -> str:
        return (
            "Generate one realistic RehearseAI practice scenario. Return valid JSON only with keys: "
            "title, topic, setting, emotionalContext, pressureSituation, objective, personalityDynamics, optionalNotes. "
            "Keep JSON keys in English. Write all scenario field values in the practice language when possible. "
            "Keep it practical, emotionally realistic, and never abusive.\n"
            f"Category: {request.category}\nDifficulty: {request.difficulty}\n"
            f"Practice language code: {request.practiceLanguage}\nFeedback language code: {request.feedbackLanguage}\n"
            f"Target role: {request.targetRole or 'general'}\nExperience: {request.experienceLevel or 'mixed'}\n"
            f"Recent history count: {len(user_history)}"
        )

    def _parse_json(self, text: str) -> dict:
        cleaned = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
        return json.loads(cleaned)
