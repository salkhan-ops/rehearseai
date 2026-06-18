/**
 * Panel voice configuration.
 *
 * Each figure tone maps to one Cartesia voice ID.  Five tone slots cover every
 * named character across all panel scenes.  To assign distinct voices, replace
 * the IDs below with voice IDs from https://play.cartesia.ai → Voices Library.
 *
 * Current default: all tones use Skylar (confirmed working).  Once you've
 * chosen five voices, drop in their IDs and each character will sound distinct.
 */

import type { EnvironmentMode } from "@/lib/types";

type FigureTone = "neutral" | "skeptical" | "notes" | "forward" | "distant";

// ─── Voice palette ────────────────────────────────────────────────────────────
// Replace any of these with a Cartesia voice ID to give that tone a unique voice.
export const PANEL_TONE_VOICES: Record<FigureTone, string> = {
  neutral:   "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4", // Skylar — warm American female (Taylor, Chair, CEO, Advisor)
  notes:     "3e32f3c5-9ac0-4192-9994-87fdb277120f", // Noam — clear authoritative male (Jordan, Professor, CFO, Analyst)
  skeptical: "62ae83ad-4f6a-430b-af41-a9bede9286ca", // Gemma — decisive British female (Dr. Chen, Skeptic)
  forward:   "a167e0f3-df7e-4d52-a9c3-f949145efdab", // Blake — energetic male (Partner, Ops)
  distant:   "87286a8d-7ea7-4235-a41a-dd9fa6630feb", // Henry — monotone male (Reader, Dr. Patel)
};

// ─── Speaker → tone map ───────────────────────────────────────────────────────
// Keyed by the exact speaker names that Gemini places inside [Name]: tags.
// These names match the panel_prompts.py member definitions and the
// AICharacterEnvironment.tsx scene figure labels (or speakerName overrides).
const SPEAKER_TONE_MAP: Record<string, FigureTone> = {
  // Executive Interview
  Jordan:            "notes",
  Taylor:            "neutral",
  // Thesis Defense Panel
  Professor:         "notes",
  Chair:             "neutral",
  Reader:            "distant",
  // Investor Panel
  Partner:           "forward",
  Analyst:           "notes",
  Skeptic:           "skeptical",
  // Board Meeting
  CEO:               "neutral",
  CFO:               "notes",
  Ops:               "forward",
  Strategy:          "notes",
  Director:          "skeptical",
  // Hostile Panel (speakerName overrides — labels are all "Panelist")
  "Dr. Chen":        "skeptical",
  "Prof. Williams":  "notes",
  "Dr. Patel":       "distant",
  // Chair shared with Thesis Defense — already mapped above
  // Conference Q&A
  "Questioner A":    "neutral",
  "Questioner B":    "skeptical",
  "Questioner C":    "notes",
  // Classroom Presentation
  Alex:              "neutral",
  Sam:               "forward",
  Instructor:        "notes",
  // Custom Future Mode
  Advisor:           "neutral",
  Observer:          "notes",
  Challenger:        "skeptical",
};

// ─── Panel mode detection ─────────────────────────────────────────────────────
export const PANEL_ENVIRONMENT_MODES = new Set<EnvironmentMode>([
  "Executive Interview",
  "Thesis Defense Panel",
  "Investor Panel",
  "Board Meeting",
  "Hostile Panel",
  "Conference Q&A",
  "Classroom Presentation",
  "Custom Future Mode",
]);

export function isPanelMode(mode: EnvironmentMode): boolean {
  return PANEL_ENVIRONMENT_MODES.has(mode);
}

// ─── Voice lookup ─────────────────────────────────────────────────────────────
/**
 * Returns the Cartesia voice ID for a named panel speaker.
 * Returns null when the name is unknown (caller should fall back to selectedVoiceId).
 */
export function getPanelVoiceId(speakerName: string): string | null {
  const tone = SPEAKER_TONE_MAP[speakerName];
  if (!tone) return null;
  return PANEL_TONE_VOICES[tone] ?? null;
}
