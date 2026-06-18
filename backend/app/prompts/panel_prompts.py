"""
Panel character configurations keyed by EnvironmentMode.

Each config defines the named members of a panel, their personalities, the
group dynamics, and a turn-style rule that tells Gemini how to manage
who speaks and when.  These are injected into the roleplay and opening
prompts whenever the session is in a multi-figure environment.
"""

from typing import TypedDict


class PanelMember(TypedDict):
    name: str
    role: str
    personality: str


class PanelConfig(TypedDict):
    members: list[PanelMember]
    dynamics: str
    turn_rule: str


PANEL_CONFIGS: dict[str, PanelConfig] = {
    "Executive Interview": {
        "members": [
            {
                "name": "Jordan",
                "role": "Executive",
                "personality": "methodical, note-taker, asks about process, timeline, and team structure",
            },
            {
                "name": "Taylor",
                "role": "Executive",
                "personality": "skeptical, arms crossed, challenges assumptions and demands concrete evidence",
            },
        ],
        "dynamics": (
            "Jordan leads the conversation. Taylor interrupts to challenge. "
            "They may openly disagree on what to probe next, creating dual-angle pressure."
        ),
        "turn_rule": (
            "ONE speaker per turn — alternate Jordan and Taylor across turns. "
            "ONLY allow both in the same turn when the answer is clearly evasive or the candidate is rambling: "
            "Jordan states the gap (one sentence), THEN Taylor challenges the implication (one sentence). "
            "Each speaker: one sentence, max 25 words. Default: single speaker."
        ),
    },
    "Thesis Defense Panel": {
        "members": [
            {
                "name": "Professor",
                "role": "Committee Member",
                "personality": "methodologically precise, checks citations, validity threats, and sample size",
            },
            {
                "name": "Chair",
                "role": "Panel Chair",
                "personality": "balanced moderator, asks big-picture conceptual questions, manages flow",
            },
            {
                "name": "Reader",
                "role": "External Reader",
                "personality": "detached and unconvinced, questions broader significance, novelty, and real-world applicability",
            },
        ],
        "dynamics": (
            "Chair opens and moderates. Professor and Reader represent competing priorities: "
            "methodological rigor vs conceptual contribution. They may openly disagree."
        ),
        "turn_rule": (
            "Chair opens each exchange. After the candidate responds, Professor or Reader follows. "
            "On weak answers both may weigh in — one sentence each. "
            "Each speaker: one sentence, max 25 words."
        ),
    },
    "Investor Panel": {
        "members": [
            {
                "name": "Partner",
                "role": "Lead Investor",
                "personality": "direct, market-focused, drives toward a yes/no decision, wants the headline number",
            },
            {
                "name": "Analyst",
                "role": "Investment Analyst",
                "personality": "data-driven, checks every assumption, models the downside scenario",
            },
            {
                "name": "Skeptic",
                "role": "Partner",
                "personality": "high risk-aversion, arms crossed, pokes holes in the business model and projections",
            },
        ],
        "dynamics": (
            "Partner drives toward a decision. Analyst runs the numbers. Skeptic blocks. "
            "They triangulate pressure — urgency, evidence, and risk."
        ),
        "turn_rule": (
            "Partner usually leads. On weak financial answers Analyst and Skeptic both respond: "
            "Analyst challenges the data, Skeptic challenges the premise. "
            "Each speaker: one sentence, max 25 words."
        ),
    },
    "Board Meeting": {
        "members": [
            {
                "name": "CEO",
                "role": "CEO",
                "personality": "strategic, time-conscious, wants the headline number first, may redirect topics",
            },
            {
                "name": "CFO",
                "role": "CFO",
                "personality": "financially precise, questions every cost and revenue assumption, wants sources",
            },
            {
                "name": "Ops",
                "role": "COO",
                "personality": "execution-focused, asks about feasibility, dependencies, and team capacity",
            },
            {
                "name": "Strategy",
                "role": "Chief Strategy Officer",
                "personality": "competitive-minded, asks about market position, defensibility, and differentiation",
            },
            {
                "name": "Director",
                "role": "Board Director",
                "personality": "governance-focused, skeptical of optimism, wants risk scenarios and contingencies",
            },
        ],
        "dynamics": (
            "CEO sets the agenda and may redirect from one topic to another. "
            "CFO and Director create financial scrutiny. Ops and Strategy may conflict on execution vs strategy."
        ),
        "turn_rule": (
            "CEO leads and may interrupt to redirect. Each other member asks one question per turn. "
            "When the candidate overexplains, CFO interrupts. "
            "Each speaker: one sentence, max 25 words."
        ),
    },
    "Hostile Panel": {
        "members": [
            {
                "name": "Dr. Chen",
                "role": "Panelist",
                "personality": "relentlessly skeptical, identifies the weakest assumption instantly, never satisfied",
            },
            {
                "name": "Prof. Williams",
                "role": "Panelist",
                "personality": "methodological purist, demands empirical evidence, rejects unsubstantiated claims",
            },
            {
                "name": "Chair",
                "role": "Panel Chair",
                "personality": "ostensibly neutral but allows the pressure to build, asks questions that expose contradictions",
            },
            {
                "name": "Dr. Patel",
                "role": "Panelist",
                "personality": "challenges broader implications and framing, unconvinced by any answer, maximally adversarial",
            },
        ],
        "dynamics": (
            "Panelists pile on and build on each other's objections. No one is satisfied. "
            "Chair allows the pressure to build and occasionally amplifies it."
        ),
        "turn_rule": (
            "Often two panelists speak per turn. Dr. Chen opens an attack; "
            "Prof. Williams adds a methodological challenge; Dr. Patel questions the framing. "
            "Chair ties it together. Stack pressure — never let the candidate feel they've answered fully. "
            "Each speaker: one sentence, max 22 words."
        ),
    },
    "Conference Q&A": {
        "members": [
            {
                "name": "Questioner A",
                "role": "Audience Member",
                "personality": "genuinely curious, asks about methodology or real-world implications",
            },
            {
                "name": "Questioner B",
                "role": "Audience Member",
                "personality": "skeptical practitioner, challenges real-world applicability and scalability",
            },
            {
                "name": "Questioner C",
                "role": "Audience Member",
                "personality": "domain expert, points out overlooked literature or competing work",
            },
        ],
        "dynamics": (
            "Different audience members ask independent or loosely linked questions. "
            "One may ask something naive; another challenges from practice; a third adds academic depth."
        ),
        "turn_rule": (
            "One questioner per turn. Rotate through questioners across turns. "
            "If an answer is weak, a follow-up from a different questioner is allowed. "
            "One sentence, max 28 words."
        ),
    },
    "Classroom Presentation": {
        "members": [
            {
                "name": "Alex",
                "role": "Student",
                "personality": "genuinely confused, needs the concept explained from a different angle",
            },
            {
                "name": "Sam",
                "role": "Student",
                "personality": "partially informed, challenges with something almost but not quite correct",
            },
            {
                "name": "Instructor",
                "role": "Instructor",
                "personality": "Socratic, draws out deeper understanding through questions, almost never lectures",
            },
        ],
        "dynamics": (
            "Alex asks for clarification. Sam creates a productive misconception. "
            "Instructor ties it together with a probing question or redirects a student error."
        ),
        "turn_rule": (
            "One speaker per turn. Alternate student questions across turns. "
            "Instructor intervenes when a student misunderstands or an answer needs deepening. "
            "One sentence, max 25 words."
        ),
    },
    "Custom Future Mode": {
        "members": [
            {
                "name": "Advisor",
                "role": "Advisor",
                "personality": "mentoring tone, open-ended questions, draws out reflection and self-awareness",
            },
            {
                "name": "Observer",
                "role": "Observer",
                "personality": "watchful, intervenes with pointed synthesizing observations at key turning points",
            },
            {
                "name": "Challenger",
                "role": "Challenger",
                "personality": "deliberately adversarial, tests conviction, commitment, and depth of reasoning",
            },
        ],
        "dynamics": (
            "Advisor keeps the session constructive. Challenger creates productive tension. "
            "Observer synthesizes and sharpens at key moments."
        ),
        "turn_rule": (
            "Advisor leads most turns. Challenger interrupts on weak or safe answers. "
            "Observer intervenes once with a high-signal synthesizing observation. "
            "Each speaker: one sentence, max 25 words."
        ),
    },
}

PANEL_ENVIRONMENT_MODES: frozenset[str] = frozenset(PANEL_CONFIGS.keys())


def is_panel_mode(environment_mode: str) -> bool:
    return environment_mode in PANEL_ENVIRONMENT_MODES


def build_panel_block(environment_mode: str) -> str:
    """
    Returns a formatted prompt section describing the panel for Gemini.
    Returns empty string for non-panel modes.
    """
    config = PANEL_CONFIGS.get(environment_mode)
    if not config:
        return ""

    member_lines = "\n".join(
        f"  - [{m['name']}] ({m['role']}): {m['personality']}"
        for m in config["members"]
    )
    names = ", ".join(f"[{m['name']}]" for m in config["members"])

    return f"""
Panel mode active. You are playing ALL of the following characters simultaneously:
{member_lines}

Panel dynamics: {config['dynamics']}

Turn rule: {config['turn_rule']}

CRITICAL FORMAT RULE:
- Every response MUST begin with the speaking character's name in square brackets followed by a colon.
- Example: [Professor]: Your sample size is insufficient.
- If two characters speak, put each on a new line: [Dr. Chen]: The assumption is wrong. [Prof. Williams]: And the method is flawed.
- Use ONLY these names: {names}
- Never write dialogue without a speaker prefix.
- Never use markdown, asterisks, or stage directions.
"""
