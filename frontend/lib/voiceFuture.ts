export const voiceFutureCapabilities = {
  geminiLiveApi: false,
  streamingAudio: false,
  realTimeInterruption: false,
  speechEmotionAnalysis: false,
  pacingAnalysis: false,
  fillerWordDetection: false,
  pauseAnalysis: false,
} as const;

export type VoiceFutureCapability = keyof typeof voiceFutureCapabilities;

export function getVoiceCapabilityStatus(capability: VoiceFutureCapability) {
  return voiceFutureCapabilities[capability] ? "ready" : "planned";
}
