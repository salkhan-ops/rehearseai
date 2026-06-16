// Lightweight speech emotion/confidence analyzer.
// Derives a delivery label from prosody signals already collected during the turn:
//   - F0 (pitch) samples from the Deepgram proxy prosody stream
//   - RMS (energy) samples from the same stream
//   - Word count / speech duration → words per minute
//   - Filler word count from the transcript text
// No ML inference — pure signal processing. Fast enough to run synchronously on finalizeTurn.

export type SpeechEmotionLabel = "confident" | "nervous" | "hesitant" | "monotone" | "rushed" | "unclear";

export interface SpeechEmotionResult {
  label: SpeechEmotionLabel;
  confidenceScore: number; // 0–1 delivery confidence (not classification confidence)
  signals: {
    pitchVariancePct: number; // coefficient of variation of voiced F0 frames
    pitchMeanHz: number;
    energyTrend: number; // −1 (fading out) → +1 (building up)
    wpm: number;
    fillerRatio: number; // filler tokens / total words
    fillerCount: number;
  };
}

// Patterns that indicate disfluency in interview speech.
// "like" is included because it's the single most common interview filler.
// Phrases are checked before words to avoid double-counting.
const FILLER_PATTERNS: RegExp[] = [
  /\bum+\b/gi,
  /\buh+\b/gi,
  /\ber+\b/gi,
  /\bahh?\b/gi,
  /\bhmm+\b/gi,
  /\byou know\b/gi,
  /\bi mean\b/gi,
  /\bsort of\b/gi,
  /\bkind of\b/gi,
  /\bi guess\b/gi,
  /\bi suppose\b/gi,
  /\blike\b/gi,
  /\bbasically\b/gi,
];

function countFillers(text: string): number {
  let count = 0;
  for (const pattern of FILLER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length);
}

// Positive = energy building toward end of turn; negative = trailing off.
function computeEnergyTrend(rmsSamples: number[]): number {
  if (rmsSamples.length < 4) return 0;
  const half = Math.floor(rmsSamples.length / 2);
  const avgFirst = mean(rmsSamples.slice(0, half));
  const avgSecond = mean(rmsSamples.slice(half));
  const scale = Math.max(avgFirst, avgSecond, 0.001);
  return Math.max(-1, Math.min(1, (avgSecond - avgFirst) / scale));
}

export function analyzeSpeechEmotion({
  f0Samples,
  rmsSamples,
  transcript,
  speechDurationMs,
}: {
  f0Samples: number[];
  rmsSamples: number[];
  transcript: string;
  speechDurationMs: number;
}): SpeechEmotionResult {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Words per minute
  const durationMin = Math.max(speechDurationMs, 1000) / 60000;
  const wpm = Math.round(wordCount / durationMin);

  // Filler detection
  const fillerCount = countFillers(transcript);
  const fillerRatio = wordCount > 0 ? Math.min(1, fillerCount / wordCount) : 0;

  // Pitch analysis — only voiced frames (human fundamental: 80–400 Hz)
  const voicedF0 = f0Samples.filter((f) => f >= 80 && f <= 400);
  const pitchMeanHz = voicedF0.length > 0 ? Math.round(mean(voicedF0)) : 0;
  const pitchVariancePct = pitchMeanHz > 0 ? Math.round((stddev(voicedF0) / pitchMeanHz) * 1000) / 10 : 0;

  // Energy trend
  const energyTrend = computeEnergyTrend(rmsSamples);

  // ─── Confidence score ───────────────────────────────────────────────────────
  let score = 0.5;

  // WPM: 120–165 is ideal interview pace
  if (wpm >= 120 && wpm <= 165) score += 0.12;
  else if (wpm >= 100 && wpm < 120) score += 0.04;
  else if (wpm >= 165 && wpm <= 190) score += 0.04;
  else if (wpm < 80 || wpm > 210) score -= 0.12;
  else score -= 0.05;

  // Filler words: < 3% is natural, > 15% is problematic
  if (fillerRatio < 0.03) score += 0.12;
  else if (fillerRatio < 0.08) score += 0.04;
  else if (fillerRatio > 0.15) score -= 0.15;
  else if (fillerRatio > 0.10) score -= 0.08;

  // Pitch variation (only when we have meaningful F0 data)
  if (voicedF0.length >= 4) {
    if (pitchVariancePct < 8) score -= 0.12;       // flat/monotone delivery
    else if (pitchVariancePct <= 28) score += 0.10; // natural expressive range
    else if (pitchVariancePct > 45) score -= 0.10;  // very anxious/erratic
  }

  // Energy: trailing off is a sign of losing conviction
  if (energyTrend > 0.15) score += 0.06;
  else if (energyTrend < -0.25) score -= 0.08;

  score = Math.max(0, Math.min(1, Math.round(score * 100) / 100));

  // ─── Label ──────────────────────────────────────────────────────────────────
  let label: SpeechEmotionLabel = "unclear";

  if (wordCount < 4 || (voicedF0.length < 2 && rmsSamples.length < 3)) {
    // Not enough data
    label = "unclear";
  } else if (voicedF0.length >= 4 && pitchVariancePct < 8 && wordCount >= 6) {
    label = "monotone";
  } else if (wpm > 190 && wordCount >= 8) {
    label = "rushed";
  } else if (score < 0.38) {
    label = fillerRatio > 0.08 ? "nervous" : "hesitant";
  } else if (score >= 0.62) {
    label = "confident";
  } else {
    label = "unclear";
  }

  return {
    label,
    confidenceScore: score,
    signals: {
      pitchVariancePct,
      pitchMeanHz,
      energyTrend: Math.round(energyTrend * 100) / 100,
      wpm,
      fillerRatio: Math.round(fillerRatio * 100) / 100,
      fillerCount,
    },
  };
}
