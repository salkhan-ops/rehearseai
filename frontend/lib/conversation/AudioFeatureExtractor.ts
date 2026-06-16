export type SilenceCategory = "micro_pause" | "yielding_pause" | "abandoned_pause";

export type AudioFeatures = {
  volume_rms: number;
  silence_category: SilenceCategory;
  filler_rate: number;
  voice_onset_delay_ms: number;
  pitch_rising: boolean;
  volume_rising: boolean;
  has_voice_activity: boolean;
  sampled_at: number;
};

const FILLERS = new Set(["um", "uh", "erm", "ah", "like", "so", "you", "know"]);
const VOICE_ACTIVITY_THRESHOLD = 0.015;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function silenceCategory(silenceMs: number): SilenceCategory {
  if (silenceMs < 300) return "micro_pause";
  if (silenceMs <= 800) return "yielding_pause";
  return "abandoned_pause";
}

function dominantBin(data: Uint8Array) {
  let peak = 0;
  let index = 0;
  for (let i = 2; i < data.length; i += 1) {
    if (data[i] > peak) {
      peak = data[i];
      index = i;
    }
  }
  return index;
}

export class AudioFeatureExtractor {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private timeData: Uint8Array | null = null;
  private freqData: Uint8Array | null = null;
  private volumeHistory: Array<{ at: number; volume: number }> = [];
  private pitchHistory: Array<{ at: number; bin: number }> = [];
  private aiAudioEndedAt = 0;
  private firstVoiceOnsetAt = 0;
  private voiceActivityFrames = 0;
  private totalFrames = 0;

  async connect(stream: MediaStream) {
    this.disconnect();
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    this.context = new AudioContextCtor();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.source = this.context.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
    this.timeData = new Uint8Array(this.analyser.fftSize);
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  disconnect() {
    this.source?.disconnect();
    this.context?.close().catch(() => undefined);
    this.context = null;
    this.analyser = null;
    this.source = null;
    this.timeData = null;
    this.freqData = null;
    this.volumeHistory = [];
    this.pitchHistory = [];
    this.firstVoiceOnsetAt = 0;
    this.voiceActivityFrames = 0;
    this.totalFrames = 0;
  }

  markAiAudioEnded(at = Date.now()) {
    this.aiAudioEndedAt = at;
    this.firstVoiceOnsetAt = 0;
    this.voiceActivityFrames = 0;
    this.totalFrames = 0;
  }

  get hasRealVoiceActivity(): boolean {
    if (this.totalFrames < 5) return false;
    return this.voiceActivityFrames / this.totalFrames >= 0.2;
  }

  sample(options: { silenceMs?: number; transcript?: string; speechDurationMs?: number } = {}): AudioFeatures {
    const now = Date.now();
    let volume = 0;
    let pitchBin = 0;
    if (this.analyser && this.timeData && this.freqData) {
      this.analyser.getByteTimeDomainData(this.timeData);
      let sum = 0;
      for (const value of this.timeData) {
        const centered = (value - 128) / 128;
        sum += centered * centered;
      }
      volume = clamp01(Math.sqrt(sum / this.timeData.length));
      this.analyser.getByteFrequencyData(this.freqData);
      pitchBin = dominantBin(this.freqData);
    }

    this.totalFrames += 1;
    if (volume > VOICE_ACTIVITY_THRESHOLD) this.voiceActivityFrames += 1;

    this.volumeHistory.push({ at: now, volume });
    this.pitchHistory.push({ at: now, bin: pitchBin });
    this.volumeHistory = this.volumeHistory.filter((item) => now - item.at <= 1200);
    this.pitchHistory = this.pitchHistory.filter((item) => now - item.at <= 1200);

    const previousVolume = this.volumeHistory[0]?.volume || 0;
    const volumeRising = volume > 0.025 && volume - previousVolume > 0.012;
    if (this.aiAudioEndedAt && !this.firstVoiceOnsetAt && volume > 0.035) this.firstVoiceOnsetAt = now;

    const recent = this.pitchHistory.filter((item) => now - item.at <= 500);
    const prior = this.pitchHistory.filter((item) => now - item.at > 500 && now - item.at <= 1000);
    const avg = (items: Array<{ bin: number }>) => items.reduce((sum, item) => sum + item.bin, 0) / Math.max(1, items.length);
    const pitchRising = recent.length > 1 && prior.length > 1 && avg(recent) > avg(prior) + 1.5;

    const words = (options.transcript || "").toLowerCase().match(/[a-z']+/g) || [];
    const fillerCount = words.filter((word, index) => FILLERS.has(word) || (word === "know" && words[index - 1] === "you")).length;
    const minutes = Math.max((options.speechDurationMs || 0) / 60000, 0.1);

    return {
      volume_rms: Number(volume.toFixed(4)),
      silence_category: silenceCategory(options.silenceMs || 0),
      filler_rate: Number((fillerCount / minutes).toFixed(2)),
      voice_onset_delay_ms: this.firstVoiceOnsetAt && this.aiAudioEndedAt ? this.firstVoiceOnsetAt - this.aiAudioEndedAt : 0,
      pitch_rising: pitchRising,
      volume_rising: volumeRising,
      has_voice_activity: volume > VOICE_ACTIVITY_THRESHOLD,
      sampled_at: now,
    };
  }
}

export function classifySilence(silenceMs: number): SilenceCategory {
  return silenceCategory(silenceMs);
}
