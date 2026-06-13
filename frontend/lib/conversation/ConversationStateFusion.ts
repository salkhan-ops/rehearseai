import type { AudioFeatures, SilenceCategory } from "./AudioFeatureExtractor";
import type { VisionSignals } from "./VisionSignalExtractor";

export type RealtimeConversationEngineState = "LISTENING" | "PROCESSING" | "AI_SPEAKING" | "WAITING" | "PROMPTING";

export type ConversationState = {
  audio: AudioFeatures;
  vision: VisionSignals;
  transcript: {
    final: string;
    interim: string;
    is_final: boolean;
    speech_final: boolean;
  };
  timing: {
    silence_ms: number;
    speech_duration_ms: number;
  };
  turn_complete_probability: number;
  engine_state: RealtimeConversationEngineState;
  sampled_at: number;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function computeTurnCompleteProbability(input: {
  silenceMs: number;
  transcriptIsFinal: boolean;
  speechReadiness: number;
  gazeOnCamera: number;
  pitchRising: boolean;
  mouthAperture: number;
  browRaised: number;
}) {
  let base = 0;
  if (input.silenceMs > 800 && input.transcriptIsFinal) base += 0.5;
  if (input.speechReadiness < 0.1) base += 0.2;
  if (input.gazeOnCamera > 0.6) base += 0.1;
  if (!input.pitchRising) base += 0.1;
  if (input.mouthAperture < 0.1) base += 0.1;
  if (input.speechReadiness > 0.6) base -= 0.4;
  if (input.silenceMs < 300) base -= 0.3;
  if (input.browRaised > 0.6) base -= 0.1;
  return Number(clamp01(base).toFixed(3));
}

export function fuseConversationState(input: {
  audio: AudioFeatures;
  vision: VisionSignals;
  finalTranscript: string;
  interimTranscript: string;
  transcriptIsFinal: boolean;
  speechFinal: boolean;
  silenceMs: number;
  speechDurationMs: number;
  engineState: RealtimeConversationEngineState;
}): ConversationState {
  const turnComplete = computeTurnCompleteProbability({
    silenceMs: input.silenceMs,
    transcriptIsFinal: input.transcriptIsFinal,
    speechReadiness: input.vision.speech_readiness,
    gazeOnCamera: input.vision.gaze_on_camera,
    pitchRising: input.audio.pitch_rising,
    mouthAperture: input.vision.mouth_aperture,
    browRaised: input.vision.brow_raised,
  });
  return {
    audio: input.audio,
    vision: input.vision,
    transcript: {
      final: input.finalTranscript,
      interim: input.interimTranscript,
      is_final: input.transcriptIsFinal,
      speech_final: input.speechFinal,
    },
    timing: {
      silence_ms: input.silenceMs,
      speech_duration_ms: input.speechDurationMs,
    },
    turn_complete_probability: turnComplete,
    engine_state: input.engineState,
    sampled_at: Date.now(),
  };
}

export function silenceCategoryToWaitMs(category: SilenceCategory) {
  if (category === "micro_pause") return 300;
  if (category === "yielding_pause") return 800;
  return 1200;
}
