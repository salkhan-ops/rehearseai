# Evidence of production execution

## `sample-session-log.jsonl`

This is a **redacted/synthetic sample**, not a raw capture. Real per-session logs are
written locally to `session-logs/*.jsonl` by `frontend/lib/sessionLogger.ts` (see the
`LogEvent`/`event` type union at `frontend/lib/sessionLogger.ts:5-12`) and are
intentionally excluded from version control (see `.gitignore`) because they contain a
real beta tester's Firebase `userId` and the verbatim text of what they said during
practice sessions — that's real personal data from people who tested the product
before launch, not something we publish.

This file keeps the **exact same event schema** the production logger actually emits —
`SESSION_START`, `TRANSCRIPT`, `TURN_DECISION`, `WAIT_LONGER`, `TURN_SENT`, `TTS_START`,
`TTS_END`, `VETO`, and the `cameraSignal: "likely_finished"` /
`reason: "mediapipe_likely_finished"` fields that come from the on-device MediaPipe
turn-taking signal (`frontend/app/session/[id]/SessionClient.tsx`) — but with a
placeholder `userId`/`sessionId` and a synthetic (invented) interview exchange in place
of a real tester's words, so it can be shared publicly without exposing anyone's data.

What it demonstrates:
- A real interviewer follow-up generated from the specific number the user gave
  ("You said latency improved significantly — give me the actual number...") rather
  than a scripted next question, showing the live Gemini roleplay call reacting to
  actual answer content.
- The turn-taking decision sequence (`keep_listening` → `WAIT_LONGER` →
  `force_send` on the camera-assisted "likely finished" signal) that determines
  *when* the AI is allowed to respond, separate from the LLM call that decides
  *what* it says.
- A `VETO` / `hard_timeout` event, showing the system's fallback behavior when no
  new speech arrives.

For real, currently-live evidence beyond this repo, the admin dashboard
(`/admin/growth`, `/admin/telemetry-labels`) reflects live Firestore-backed event
counts from actual sessions — happy to add a dashboard screenshot here too if useful,
since that's aggregate data rather than an individual user's transcript.
