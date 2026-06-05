import type { LocalCameraSignals, PersonalTimingBaseline, VoiceTimingSignals } from "@/lib/local-signals/types";
import { extractLocalPauseFeatures } from "./localFeatureExtractor";
import { predictPauseIntent } from "./localPauseClassifier";

export function classifyPauseWithRules(
  voice: VoiceTimingSignals,
  camera?: LocalCameraSignals | null,
  baseline?: PersonalTimingBaseline,
) {
  return predictPauseIntent(extractLocalPauseFeatures(voice, camera, baseline));
}
