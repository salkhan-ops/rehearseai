// Session debug logger — only posts when NEXT_PUBLIC_DEBUG_SESSION_LOG=true.
// One .jsonl file per conversation session, written to /session-logs/ at project root.

export type LogEventType =
  | "SESSION_START"
  | "TTS_START"
  | "TTS_END"
  | "TRANSCRIPT"
  | "TURN_DECISION"
  | "TURN_SENT"
  | "VETO"
  | "WAIT_LONGER"
  | "STATE_CHANGE"
  | "ERROR"
  | "LISTEN_RESTART"
  | "VOICE_CHECKIN";

export interface LogEntry {
  event: LogEventType;
  [key: string]: unknown;
}

export interface SessionLoggerInstance {
  log: (entry: LogEntry) => void;
  file: string;
  sessionId: string;
}

const ENABLED = typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_SESSION_LOG === "true";

function makeFileName(sessionId: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const shortId = sessionId.slice(0, 8).replace(/[^a-zA-Z0-9]/g, "");
  return `session_${ts}_${shortId}.jsonl`;
}

export function createSessionLogger(sessionId: string): SessionLoggerInstance {
  const file = makeFileName(sessionId);

  function log(entry: LogEntry) {
    if (!ENABLED) return;
    const payload = { file, entry };
    fetch("/api/session-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  }

  return { log, file, sessionId };
}

// No-op logger for when logging is disabled
export const nullLogger: SessionLoggerInstance = {
  log: () => undefined,
  file: "",
  sessionId: "",
};
