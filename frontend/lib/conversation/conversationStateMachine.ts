export type NaturalConversationState =
  | "idle"
  | "starting"
  | "listening"
  | "user_speaking"
  | "user_thinking"
  | "ready_to_send"
  | "processing_ai"
  | "ai_speaking"
  | "user_interrupting"
  | "paused"
  | "error";

export type NaturalConversationEvent =
  | "start"
  | "listening_started"
  | "speech_detected"
  | "silence_detected"
  | "send_ready"
  | "ai_processing"
  | "ai_speaking"
  | "ai_finished"
  | "interrupt"
  | "pause"
  | "resume"
  | "error"
  | "reset";

export function transitionNaturalConversationState(
  state: NaturalConversationState,
  event: NaturalConversationEvent,
): NaturalConversationState {
  if (event === "reset") return "idle";
  if (event === "error") return "error";
  if (event === "pause") return "paused";
  if (event === "resume") return state === "paused" ? "listening" : state;
  if (event === "interrupt") return "user_interrupting";

  switch (state) {
    case "idle":
      return event === "start" ? "starting" : state;
    case "starting":
      return event === "listening_started" ? "listening" : state;
    case "listening":
      if (event === "speech_detected") return "user_speaking";
      if (event === "ai_processing") return "processing_ai";
      return state;
    case "user_speaking":
      if (event === "silence_detected") return "user_thinking";
      if (event === "send_ready") return "ready_to_send";
      return state;
    case "user_thinking":
      if (event === "speech_detected") return "user_speaking";
      if (event === "send_ready") return "ready_to_send";
      return state;
    case "ready_to_send":
      return event === "ai_processing" ? "processing_ai" : state;
    case "processing_ai":
      return event === "ai_speaking" ? "ai_speaking" : state;
    case "ai_speaking":
      return event === "ai_finished" ? "listening" : state;
    case "user_interrupting":
      return event === "listening_started" || event === "speech_detected" ? "user_speaking" : state;
    case "paused":
      return state;
    case "error":
      return event === "start" ? "starting" : state;
    default:
      return state;
  }
}

export function naturalConversationStatusText(state: NaturalConversationState) {
  if (state === "starting") return "Starting conversation...";
  if (state === "listening") return "Listening";
  if (state === "user_speaking") return "Listening";
  if (state === "user_thinking") return "Thinking. You may continue...";
  if (state === "ready_to_send") return "Sending your answer...";
  if (state === "processing_ai") return "Sending your answer...";
  if (state === "ai_speaking") return "AI responding...";
  if (state === "user_interrupting") return "You interrupted the AI";
  if (state === "paused") return "Natural conversation paused";
  if (state === "error") return "Natural conversation paused. Switch to manual mode?";
  return "Ready";
}
