import type { PracticeType } from "@/lib/types";

export type PrepSection = { heading: string; body: string };

export type CourseConfig = {
  defaultDuration: number;
  minDuration: number;
  maxDuration: number;
  aiPersona: string;
  pressureArc: string;
  arcPhases: string[];         // ordered session phases shown in the conversation map
  successLooks: string;
  prepSections: (inputs: { topic: string; context: string; goal: string }) => PrepSection[];
};

export const courseConfigs: Record<PracticeType, CourseConfig> = {
  "Job Interview": {
    defaultDuration: 7,
    minDuration: 5,
    maxDuration: 10,
    aiPersona: "Hiring manager or VP — direct, structured, efficient. Has seen hundreds of candidates. Zero patience for vague answers.",
    pressureArc: "Rapport → behavioural questions → stress traps → pushback on specifics",
    arcPhases: ["Warm-up", "Behavioural", "Stress test", "Your close"],
    successLooks: "Clear, structured (STAR) answers. Specific details, no padding. Confident recovery when challenged.",
    prepSections: ({ topic, context, goal }) => [
      { heading: "Who you're facing", body: "A hiring manager or VP running a structured interview. They are not hostile — they are efficient. They will push when you are vague, generic, or evasive." },
      { heading: "What to bring", body: "Have one real story ready — a specific situation where something went wrong, what you did, and what you learned. Optionally paste your CV or the job description in the document section to ground the AI in your actual background." },
      { heading: "Your brief", body: `You are interviewing for: ${topic || "the role"}.\n\n${context || "Prepare to be challenged on your experience, reasoning, and past decisions."}\n\nYour win condition: ${goal || "sound clear, composed, and credible."}` },
      { heading: "How to show up", body: "Voice or camera-on gives the most realistic experience — delivery and composure under pressure are part of what's being trained. Text fallback works but removes the timing dimension." },
      { heading: "Prepare one answer right now", body: "\"Walk me through a specific situation where something went wrong, what you did, and what you'd do differently.\" — Have a real, specific story ready before the session starts." },
      { heading: "What good looks like", body: "Answers that are specific, not general. STAR structure held under pressure. No stumbling on follow-up questions. Recovery without excuses when challenged." },
    ],
  },

  "Presentation / Public Speaking": {
    defaultDuration: 8,
    minDuration: 5,
    maxDuration: 15,
    aiPersona: "Skeptical audience member or hostile moderator — engaged but unconvinced, ready to interrupt and challenge.",
    pressureArc: "Passive listening → targeted interruptions → hostile Q&A → time pressure",
    arcPhases: ["Opening hook", "Main argument", "Hostile Q&A", "Landing"],
    successLooks: "Clear structure from the first sentence. Composure under interruption. Persuasive close that leaves the audience with one clear takeaway.",
    prepSections: ({ topic, context, goal }) => [
      { heading: "Who you're facing", body: "A skeptical audience or tough moderator. Their default position is unconvinced. They will interrupt, challenge evidence, and ask for sharper answers." },
      { heading: "What to bring", body: "Have your opening line and your three main points ready to deliver out loud — not to type. Optionally paste your slide text or talk outline in the document section so the AI can challenge you on your own content. This module is designed for spoken delivery, not typed responses." },
      { heading: "Your brief", body: `You are presenting: ${topic || "your topic"}.\n\n${context || "Your audience will scrutinise your structure, evidence, and confidence."}\n\nYour win condition: ${goal || "sound structured and persuasive under pressure."}` },
      { heading: "How to show up", body: "Camera-on gives the fullest experience — posture, pacing, and eye contact all feed into the coaching. Audio-only is a solid fallback. Enable your mic before starting. If possible, stand up — that's the real thing." },
      { heading: "Prepare one answer right now", body: "\"Why should we believe this over what we already know?\" — Have a direct, evidence-backed answer. Not a restatement of your thesis — a specific, concrete reason." },
      { heading: "What good looks like", body: "One clear message from the opening sentence. Composure when interrupted. An ending that lands — not a trailing off or a summary that adds nothing." },
    ],
  },

  "Panel Discussion": {
    defaultDuration: 8,
    minDuration: 5,
    maxDuration: 15,
    aiPersona: "Panel moderator or fellow panellist — opinionated, fast, will interrupt or redirect if your answers run long.",
    pressureArc: "Open questions → follow-up pressure → direct contradiction → time challenge",
    arcPhases: ["Positioning", "Direct challenge", "Contradiction", "Final word"],
    successLooks: "Concise, memorable, specific. One point per answer. You add something the audience didn't already know.",
    prepSections: ({ topic, context, goal }) => [
      { heading: "Who you're facing", body: "A moderator or fellow panellist with opinions. They will cut you off if you run long, redirect if you drift, and challenge you directly if you are vague or safe." },
      { heading: "What to bring", body: "Know your position on the topic before you start — you need a clear, defensible point of view to hold under contradiction. No materials needed; the AI generates the pressure from your answers. Templates below work with zero setup." },
      { heading: "Your brief", body: `You are on a panel discussing: ${topic || "your topic"}.\n\n${context || "Be ready for direct challenges to your position."}\n\nYour win condition: ${goal || "be memorable, concise, and specific."}` },
      { heading: "How to show up", body: "Voice gives you realistic interruption timing — a key skill this module trains. Text works but loses the cadence dimension. Camera-on is optional." },
      { heading: "Key rules for this session", body: "One clear point per answer — maximum. Do not over-explain. If you cannot say it in two sentences, your point is not clear yet. Stop. Restate. Move on." },
      { heading: "What good looks like", body: "Answers that are brief and specific. You hold your position when pushed. You add something the audience didn't already have — not just a reframe of what was said." },
    ],
  },

  "Thesis Defense": {
    defaultDuration: 25,
    minDuration: 15,
    maxDuration: 45,
    aiPersona: "Academic examiner (PhD committee member) — has read your work, will target methodology, assumptions, and logical gaps.",
    pressureArc: "Clarification questions → methodology probe → logical attack → sustained challenge on assumptions",
    arcPhases: ["Methods probe", "Logic attack", "Assumptions", "Defense close"],
    successLooks: "Intellectual depth. Honest acknowledgement of limitations. Composure under sustained pressure. No deflection.",
    prepSections: ({ topic, context, goal }) => [
      { heading: "Who you're facing", body: "A PhD examiner or committee member. They have read your work. They are not trying to fail you — they are testing whether you understand the limits of your own argument." },
      { heading: "What to bring", body: "Paste your thesis abstract, methodology summary, or key findings in the document section — the AI examiner reads it as pre-session homework and challenges you on your own work. Without a document, the session is grounded in whatever you describe in the scenario fields." },
      { heading: "Your brief", body: `You are defending: ${topic || "your thesis or research"}.\n\n${context || "Expect detailed challenges to your methodology, evidence, and conclusions."}\n\nYour win condition: ${goal || "answer with depth, intellectual honesty, and composure."}` },
      { heading: "How to show up", body: "Voice or camera-on mirrors real defense conditions. Text is a valid choice for written-defense practice or when preparing structured written responses. Either mode gives full AI challenge depth." },
      { heading: "Prepare one answer right now", body: "\"What would have changed your conclusion?\" — This is the hardest question in any defense. Acknowledge your limitations with confidence. Weakness honestly stated is not a flaw; it is rigour." },
      { heading: "What good looks like", body: "Deep, specific answers. You acknowledge gaps without apologising for them. You hold your core claims with evidence and let go of unsupported ones without crumbling." },
    ],
  },

  "Salary Negotiation": {
    defaultDuration: 20,
    minDuration: 15,
    maxDuration: 25,
    aiPersona: "Hiring manager or HR representative — has a budget ceiling, approval constraints, and will use silence and repetition as tactics.",
    pressureArc: "Opening offer → resistance to counter → silence → final position test",
    arcPhases: ["Opening offer", "Your counter", "Silence & pressure", "Final position"],
    successLooks: "At or above your target. No unilateral concessions. Relationship intact. No caving to silence.",
    prepSections: ({ topic, context, goal }) => [
      { heading: "Who you're facing", body: "A hiring manager or HR rep with a budget and approval limits. They will make an opening offer designed to anchor low. They will use silence. They will repeat their constraint — but constraints are rarely absolute." },
      { heading: "What to bring", body: "Know your number, your walk-away figure, and one or two pieces of evidence for your ask (market data, competing offer, track record) before you start. No upload needed — the AI responds to whatever you say in the room." },
      { heading: "Your brief", body: `Situation: ${topic || "a salary or offer negotiation"}.\n\n${context || "Come in with a clear anchor and your walk-away figure in mind before you speak."}\n\nYour win condition: ${goal || "land at or above your target without damaging the relationship."}` },
      { heading: "How to show up", body: "Voice is strongly preferred — silence, pacing, and tone under pressure are the actual skills being trained here. The AI will go quiet to test you; that only works in voice. Text is available but loses the most critical dimension of this scenario." },
      { heading: "Three rules to hold in mind", body: "1. Anchor first — the first number sets the range.\n2. Never negotiate against yourself — do not offer a concession before they ask.\n3. Silence is not a no — it is pressure. Let it sit." },
      { heading: "What good looks like", body: "You stay calm when they repeat the constraint. You do not lower your ask without receiving something in return. You close with the relationship intact and your target met or explained." },
    ],
  },

  "Difficult Conversation": {
    defaultDuration: 12,
    minDuration: 10,
    maxDuration: 15,
    aiPersona: "Colleague, direct report, or peer with a grievance — may be defensive, avoidant, or escalating.",
    pressureArc: "Defensive posture → emotional escalation → accusatory → attempt to shut down",
    arcPhases: ["Acknowledgment", "Core issue", "Escalation", "Resolution"],
    successLooks: "Honest and direct. Behaviour described, not character. Specific outcomes stated. Composed throughout.",
    prepSections: ({ topic, context, goal }) => [
      { heading: "Who you're facing", body: "Someone with a grievance or who has been avoiding this conversation. They may become defensive, emotional, or accusatory. Their emotional state is not an attack — it is information." },
      { heading: "What to bring", body: "Know the specific behaviour you need to address and the concrete outcome you want. One sentence each is enough. The AI calibrates its emotional response to how you show up — no upload needed." },
      { heading: "Your brief", body: `Situation: ${topic || "a difficult or avoided conversation"}.\n\n${context || "Prepare to stay specific, calm, and direct when the other person escalates."}\n\nYour win condition: ${goal || "they understand your position clearly and the issue is addressed without hostility."}` },
      { heading: "How to show up", body: "Voice or camera-on — emotional tone, pacing, and composure are what's being trained here. Text works but removes the most human dimension of this scenario. If the conversation touches something real and personal, it's okay to pause at any time." },
      { heading: "Key rules for this session", body: "Describe specific behaviour, not character. Say what you observed, not what you concluded. \"You missed the deadline\" — not \"you're unreliable.\" Stay specific. Stay calm. Do not match their emotional volume." },
      { heading: "What good looks like", body: "You are honest and direct without being harsh. You stay specific throughout. The other person understands exactly what you need. The conversation ends with a clear next step — not a vague resolution." },
    ],
  },

  "Teaching Session": {
    defaultDuration: 10,
    minDuration: 8,
    maxDuration: 15,
    aiPersona: "Curious but confused learner — will ask basic questions, misunderstand, and occasionally challenge with edge cases.",
    pressureArc: "Basic clarification → conceptual confusion → edge case challenge → \"but why?\" loop",
    arcPhases: ["Concept intro", "Confusion zone", "Edge case", "Clarity check"],
    successLooks: "Simple, patient, no condescension. The learner could explain it back to someone else.",
    prepSections: ({ topic, context, goal }) => [
      { heading: "Who you're facing", body: "A curious but confused learner. They are genuinely trying to understand. They will ask questions that feel basic — and those are the hardest to answer well. They will also hit you with edge cases that expose gaps in your explanation." },
      { heading: "What to bring", body: "Have the concept you want to teach clear in your own words before you start — no notes open, no slides. The ability to explain without a crutch is exactly what this module is testing. No upload needed." },
      { heading: "Your brief", body: `You are teaching: ${topic || "your subject"}.\n\n${context || "Expect basic questions, misunderstandings, and the occasional sharp edge case."}\n\nYour win condition: ${goal || "they understand it clearly enough to explain it to someone else."}` },
      { heading: "How to show up", body: "Voice and text both work equally well here. Camera-on is optional — the core skill is clarity of explanation, not physical delivery. Choose whichever mode lets you think most freely." },
      { heading: "Prepare one answer right now", body: "\"Can you explain it without using any of the terms you just used?\" — If your explanation relies on jargon to work, it is not an explanation yet. Strip it back to what actually happens." },
      { heading: "What good looks like", body: "Simple language. Real examples, not analogies that need explaining. No impatience when the same question comes twice. They leave knowing something they did not know before." },
    ],
  },

  "Sales Pitch": {
    defaultDuration: 10,
    minDuration: 8,
    maxDuration: 15,
    aiPersona: "Budget-conscious buyer with competing priorities — initially open, then probing on ROI, timing, switching cost, and risk.",
    pressureArc: "Initial curiosity → ROI objection → timing objection → competitor question → ultimatum",
    arcPhases: ["Discovery", "ROI objection", "Timing & risk", "Close"],
    successLooks: "Objections handled without discounting. Value communicated specifically. Close without desperation.",
    prepSections: ({ topic, context, goal }) => [
      { heading: "Who you're facing", body: "A buyer with options and a budget. They are not hostile — but they need a reason. They will push on ROI (\"prove the numbers\"), timing (\"why now?\"), and risk (\"what if it doesn't work?\"). Every objection is a request for certainty." },
      { heading: "What to bring", body: "Know your product, your three strongest value claims, and your price before you start. The more specific your pitch, the harder and more useful the AI's objections will be. No upload needed — the AI responds to what you say." },
      { heading: "Your brief", body: `You are pitching: ${topic || "your product or solution"}.\n\n${context || "Prepare to handle objections on cost, urgency, implementation risk, and competition."}\n\nYour win condition: ${goal || "handle every objection without discounting and close with a clear next step."}` },
      { heading: "How to show up", body: "Voice is preferred — tone and timing under pressure are the skills that close deals. Text is available and works well for structuring objection responses. Camera-on optional." },
      { heading: "Prepare one answer right now", body: "\"We already have something that does this. Why would we switch now?\" — Do not attack their current solution. Acknowledge it. Then explain what they're missing — specifically, not in general terms." },
      { heading: "What good looks like", body: "Every objection answered with specifics, not reassurance. No panic discounting. A clear value statement they could repeat to their manager. A close that gives them a decision — not pressure." },
    ],
  },

  "Casual Chat": {
    defaultDuration: 8,
    minDuration: 5,
    maxDuration: 12,
    aiPersona: "A warm, curious friend — no agenda, no pressure. They are genuinely interested in what you're saying.",
    pressureArc: "Greeting → getting to know you → deeper topic → natural close",
    arcPhases: ["Hello", "Getting to know you", "Deeper chat", "Wrap-up"],
    successLooks: "Natural, expressive, comfortable. You held a real conversation without overthinking it.",
    prepSections: ({ topic, context, goal }) => [
      { heading: "Who you're facing", body: "A friendly, curious person. There is no pressure and no hidden agenda. They want to have a genuine conversation — ask questions, share thoughts, and enjoy the chat." },
      { heading: "What to bring", body: "Nothing to prepare. Show up as yourself. The AI follows your lead — pick any topic or use one of the quick-start templates to begin in under 10 seconds." },
      { heading: "Your brief", body: `Topic: ${topic || "an open casual conversation"}.\n\n${context || "Talk naturally. There are no wrong answers."}\n\nYour goal: ${goal || "feel comfortable expressing yourself without overthinking every word."}` },
      { heading: "How to show up", body: "Voice or text — both feel natural here. Camera is optional. There is no right mode for a casual chat." },
      { heading: "One thing to remember", body: "You don't need to be impressive. You need to be present. Listen, respond naturally, and follow the conversation where it goes." },
      { heading: "What good looks like", body: "You spoke freely. You asked a question back. The conversation felt like a real exchange — not a performance." },
    ],
  },

  "Podcast / Interview Show": {
    defaultDuration: 12,
    minDuration: 8,
    maxDuration: 20,
    aiPersona: "A podcast host — engaged, curious, and skilled at drawing out stories. They will probe for specifics, challenge vague answers, and push for the real story behind your talking points.",
    pressureArc: "Warm introduction → backstory probe → sharp insight question → controversial angle → close",
    arcPhases: ["Intro & hook", "Your story", "Insight probe", "Hot take", "Sign-off"],
    successLooks: "Conversational but substantive. Strong soundbites. Honest, specific answers. No PR non-answers. You gave them something worth airing.",
    prepSections: ({ topic, context, goal }) => [
      { heading: "Who you're facing", body: "A podcast host who has done their research. They are not hostile — but they will not let you get away with vague, rehearsed, or safe answers. They want the real story, the lesson, the opinion you actually hold." },
      { heading: "What to bring", body: "Have three genuine things to say about your topic and one opinion you actually hold that might be slightly controversial. The AI will push past the polished version — the more real your material, the more useful the session. No upload needed." },
      { heading: "Your brief", body: `Topic / show focus: ${topic || "your area of expertise or story"}.\n\n${context || "Think about the three most interesting things you can say — and the one controversial opinion you actually hold."}\n\nYour win condition: ${goal || "sound authentic, quotable, and worth coming back for."}` },
      { heading: "How to show up", body: "Voice or camera-on for the fullest experience — a podcast is a performance, and the AI responds to your energy as well as your words. Text is available. If possible, sit as you would on a real show." },
      { heading: "Prepare one answer right now", body: "\"What's the thing most people get wrong about what you do?\" — This is the question that separates memorable guests from forgettable ones. Have a real, specific, slightly uncomfortable answer ready." },
      { heading: "What good looks like", body: "You gave concrete examples, not generalities. You had at least one moment of genuine honesty or unexpected insight. You answered what was actually asked — not the safer version of the question. You sounded like a person, not a press release." },
    ],
  },
};

export function getCourseConfig(type: PracticeType): CourseConfig {
  return courseConfigs[type];
}

export const categoryToPracticeType: Record<string, PracticeType> = {
  "Interview": "Job Interview",
  "Public Speaking": "Presentation / Public Speaking",
  "Reasoning": "Panel Discussion",
  "Negotiation": "Salary Negotiation",
  "Leadership": "Difficult Conversation",
  "Difficult Conversations": "Difficult Conversation",
  "Conflict": "Difficult Conversation",
  "Teaching": "Teaching Session",
  "Sales": "Sales Pitch",
  "Casual": "Casual Chat",
  "Podcast": "Podcast / Interview Show",
  "Interview Show": "Podcast / Interview Show",
};
