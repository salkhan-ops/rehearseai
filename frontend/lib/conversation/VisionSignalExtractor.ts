import type { FaceSignalState } from "@/lib/mediapipe/faceSignalTypes";
import type { AudioFeatures } from "./AudioFeatureExtractor";

export type VisionSignals = {
  gaze_on_camera: number;
  brow_raised: number;
  brow_furrowed: number;
  mouth_aperture: number;
  head_nodding: boolean;
  speech_readiness: number;
  engagement_score: number;
  confusion_score: number;
  sampled_at: number;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export class VisionSignalExtractor {
  private poseHistory: Array<{ at: number; pitch: number; yaw: number; roll: number }> = [];
  private mouthVetoStartedAt = 0;

  sample(face: FaceSignalState, audio?: AudioFeatures | null): VisionSignals {
    const now = Date.now();
    if (!face.faceDetected) {
      this.mouthVetoStartedAt = 0;
      return {
        gaze_on_camera: 0,
        brow_raised: 0,
        brow_furrowed: 0,
        mouth_aperture: 0,
        head_nodding: false,
        speech_readiness: audio?.volume_rising ? 0.45 : 0,
        engagement_score: 0,
        confusion_score: 0,
        sampled_at: now,
      };
    }

    const pitch = face.headPitch || 0;
    const yaw = face.headYaw || 0;
    const roll = face.headRoll || 0;
    this.poseHistory.push({ at: now, pitch, yaw, roll });
    this.poseHistory = this.poseHistory.filter((item) => now - item.at <= 700);

    const previous = this.poseHistory[0];
    const headNodding = Boolean(previous && Math.abs(pitch - previous.pitch) > 5 && Math.abs(yaw - previous.yaw) < 8);
    const gazeOnCamera = clamp01(1 - Math.max(Math.abs(yaw) / 28, Math.abs(pitch) / 24, face.lookingAwayScore));
    const browRaised = clamp01(Math.max(0, -pitch) / 20 + (face.blinking ? 0.05 : 0));
    const browFurrowed = clamp01(Math.abs(roll) / 24 + (face.lookingAway ? 0.1 : 0));
    const mouthAperture = clamp01(face.mouthOpenScore);
    const speechReadiness = clamp01(
      mouthAperture * 0.55 +
      face.lipMovementScore * 0.25 +
      (audio?.volume_rising ? 0.35 : 0) +
      (audio && audio.volume_rms > 0.035 ? 0.15 : 0),
    );
    const headNodRate = headNodding ? 1 : 0;
    const blinkRateNormalized = clamp01(face.blinkRateApprox);
    const mouthMovement = clamp01(Math.max(face.lipMovementScore, face.mouthOpenScore));
    const engagement = clamp01(0.3 * gazeOnCamera + 0.2 * headNodRate + 0.2 * (1 - blinkRateNormalized) + 0.3 * mouthMovement);
    const headTilt = clamp01(Math.abs(roll) / 24);
    const confusion = clamp01(0.4 * browRaised + 0.3 * browFurrowed + 0.3 * headTilt);

    return {
      gaze_on_camera: Number(gazeOnCamera.toFixed(3)),
      brow_raised: Number(browRaised.toFixed(3)),
      brow_furrowed: Number(browFurrowed.toFixed(3)),
      mouth_aperture: Number(mouthAperture.toFixed(3)),
      head_nodding: headNodding,
      speech_readiness: Number(speechReadiness.toFixed(3)),
      engagement_score: Number(engagement.toFixed(3)),
      confusion_score: Number(confusion.toFixed(3)),
      sampled_at: now,
    };
  }

  mouthOpenVetoActive(mouthAperture: number, at = Date.now()) {
    if (mouthAperture <= 0.3) {
      this.mouthVetoStartedAt = 0;
      return false;
    }
    if (!this.mouthVetoStartedAt) this.mouthVetoStartedAt = at;
    return at - this.mouthVetoStartedAt <= 3000;
  }
}
