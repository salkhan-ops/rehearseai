/**
 * Parses Gemini panel responses that contain one or more [Name]: speaker tags.
 *
 * Input:  "[Dr. Chen]: Your sample is too small. [Prof. Williams]: And the method is flawed."
 * Output: [
 *   { speaker: "Dr. Chen",       text: "Your sample is too small." },
 *   { speaker: "Prof. Williams", text: "And the method is flawed." },
 * ]
 *
 * When no tag is found the full text is returned as a single segment with an
 * empty speaker — callers treat this as a single-voice response.
 */

export type SpeakerSegment = {
  speaker: string; // empty string means no tag was present
  text: string;
};

const TAG_RE = /\[([^\]]+)\]\s*:/g;

export function parseSpeakerTurns(raw: string): SpeakerSegment[] {
  const positions: Array<{ speaker: string; textStart: number; tagStart: number }> = [];
  let match: RegExpExecArray | null;

  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(raw)) !== null) {
    positions.push({
      speaker: match[1].trim(),
      tagStart: match.index,
      textStart: match.index + match[0].length,
    });
  }

  if (positions.length === 0) return [{ speaker: "", text: raw.trim() }];

  const segments: SpeakerSegment[] = [];
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1].tagStart : raw.length;
    const text = raw.slice(pos.textStart, end).trim();
    if (text) segments.push({ speaker: pos.speaker, text });
  }

  return segments.length > 0 ? segments : [{ speaker: "", text: raw.trim() }];
}

/**
 * Removes all [Name]: prefixes — used for chat display and report storage.
 */
export function stripSpeakerTags(raw: string): string {
  return raw.replace(/\[([^\]]+)\]\s*:\s*/g, "").trim();
}
