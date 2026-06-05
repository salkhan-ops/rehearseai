import type { LocalCameraSignals, PersonalTimingBaseline, VoiceTimingSignals } from "@/lib/local-signals/types";

export type LocalPauseFeatures = {
  silenceMs: number;
  speechDurationMs: number;
  wordsPerMinute: number;
  fillerWordRate: number;
  hasExplicitWaitPhrase: boolean;
  transcriptGrowing: boolean;
  faceDetected: boolean;
  mouthMovementActivity: number;
  lookingAwayScore: number;
  visualStillnessMs: number;
  headMovementIntensity: number;
  gazeShiftFrequency: number;
  averagePauseMs: number;
  longPauseThresholdMs: number;
  averageWordsPerMinute: number;
  hesitationMarkerRate: number;
};

const waitPhrases = ["wait", "let me think", "one second", "give me a moment"];
const fillerWords = new Set(["um", "uh", "like", "actually", "basically"]);

function wordList(text = "") {
  return text.toLowerCase().match(/[a-z']+/g) || [];
}

export function extractLocalPauseFeatures(
  voice: VoiceTimingSignals,
  camera?: LocalCameraSignals | null,
  baseline: PersonalTimingBaseline = {},
): LocalPauseFeatures {
  const finalTranscript = voice.finalTranscript || "";
  const interimTranscript = voice.interimTranscript || "";
  const words = wordList(`${finalTranscript} ${interimTranscript}`);
  const fillerCount = words.filter((word) => fillerWords.has(word)).length;
  const computedWpm = words.length / Math.max((voice.speechDurationMs || 0) / 60000, 0.01);
  const lower = `${finalTranscript} ${interimTranscript}`.toLowerCase();

  return {
    silenceMs: voice.silenceMs || 0,
    speechDurationMs: voice.speechDurationMs || 0,
    wordsPerMinute: voice.wordsPerMinute || computedWpm,
    fillerWordRate: fillerCount / Math.max(1, words.length),
    hasExplicitWaitPhrase: waitPhrases.some((phrase) => lower.includes(phrase)),
    transcriptGrowing: Boolean(interimTranscript.trim()),
    faceDetected: Boolean(camera?.faceDetected),
    mouthMovementActivity: camera?.mouthMovementIntensity ?? camera?.lipMovementActivity ?? 0,
    lookingAwayScore: camera?.lookingAwayScore ?? 0,
    visualStillnessMs: camera?.visualStillnessMs ?? 0,
    headMovementIntensity: camera?.headMovementIntensity ?? 0,
    gazeShiftFrequency: camera?.gazeShiftFrequency ?? 0,
    averagePauseMs: baseline.averagePauseMs || 900,
    longPauseThresholdMs: baseline.longPauseThresholdMs || 3400,
    averageWordsPerMinute: baseline.averageWordsPerMinute || 125,
    hesitationMarkerRate: baseline.hesitationMarkerRate || 0,
  };
}
