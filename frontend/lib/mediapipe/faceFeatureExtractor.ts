import type { Category, FaceLandmarkerResult, Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { defaultFaceSignalState, type FaceSignalState, type LookDirection } from "./faceSignalTypes";

type HistoryFrame = {
  timestamp: number;
  mouthOpenScore: number;
  blinkScore: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  centerX: number;
  centerY: number;
};

const HISTORY_MS = 6000;
const EMA_ALPHA = 0.35;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function blendshape(categories: Category[] | undefined, name: string) {
  return categories?.find((category) => category.categoryName === name)?.score || 0;
}

function averageLandmark(landmarks: NormalizedLandmark[]) {
  if (!landmarks.length) return { x: 0.5, y: 0.5 };
  const sum = landmarks.reduce((acc, landmark) => ({ x: acc.x + landmark.x, y: acc.y + landmark.y }), { x: 0, y: 0 });
  return { x: sum.x / landmarks.length, y: sum.y / landmarks.length };
}

function headPoseFromMatrix(matrix?: Matrix) {
  if (!matrix?.data || matrix.data.length < 16) return { yaw: 0, pitch: 0, roll: 0 };
  const m = matrix.data;
  const yaw = Math.atan2(m[8], m[10]) * (180 / Math.PI);
  const pitch = Math.atan2(-m[9], Math.sqrt(m[8] * m[8] + m[10] * m[10])) * (180 / Math.PI);
  const roll = Math.atan2(m[4], m[0]) * (180 / Math.PI);
  return { yaw, pitch, roll };
}

function lookDirection(yaw: number, pitch: number, centerX: number, centerY: number): LookDirection {
  if (Math.abs(yaw) > 14) return yaw > 0 ? "right" : "left";
  if (Math.abs(pitch) > 13) return pitch > 0 ? "down" : "up";
  if (centerX < 0.32) return "left";
  if (centerX > 0.68) return "right";
  if (centerY < 0.26) return "up";
  if (centerY > 0.74) return "down";
  return "center";
}

function movementIntensity(current: HistoryFrame, previous?: HistoryFrame) {
  if (!previous) return 0;
  const mouthDelta = Math.abs(current.mouthOpenScore - previous.mouthOpenScore);
  const headDelta =
    Math.abs(current.headYaw - previous.headYaw) / 35 +
    Math.abs(current.headPitch - previous.headPitch) / 35 +
    Math.abs(current.headRoll - previous.headRoll) / 35;
  const centerDelta = Math.abs(current.centerX - previous.centerX) + Math.abs(current.centerY - previous.centerY);
  return clamp01(mouthDelta * 1.6 + headDelta + centerDelta * 2);
}

function ema(current: number, previous: number, alpha = EMA_ALPHA): number {
  return alpha * current + (1 - alpha) * previous;
}

export class FaceFeatureExtractor {
  private history: HistoryFrame[] = [];
  private lastMouthActiveAt = Date.now();
  private lastVisualActiveAt = Date.now();
  private blinkEvents: number[] = [];
  private wasBlinking = false;
  private smoothedMouthOpen = 0;
  private smoothedLipMovement = 0;
  private smoothedHeadMovement = 0;
  private smoothedLateralLip = 0;

  reset() {
    this.history = [];
    this.lastMouthActiveAt = Date.now();
    this.lastVisualActiveAt = Date.now();
    this.blinkEvents = [];
    this.wasBlinking = false;
    this.smoothedMouthOpen = 0;
    this.smoothedLipMovement = 0;
    this.smoothedHeadMovement = 0;
    this.smoothedLateralLip = 0;
  }

  extract(result: FaceLandmarkerResult | null, timestamp = Date.now()): FaceSignalState {
    const landmarks = result?.faceLandmarks?.[0];
    if (!result || !landmarks?.length) {
      return { ...defaultFaceSignalState, timestamp };
    }

    const categories = result.faceBlendshapes?.[0]?.categories || [];
    const blinkScore = Math.max(blendshape(categories, "eyeBlinkLeft"), blendshape(categories, "eyeBlinkRight"));
    const jawOpen = blendshape(categories, "jawOpen");
    const mouthClose = blendshape(categories, "mouthClose");
    const rawMouthOpenScore = clamp01(jawOpen * 0.9 + (1 - mouthClose) * 0.1);

    // Richer lateral lip movement: funnel, pucker, left/right stretch and corner pulls
    const mouthFunnel = blendshape(categories, "mouthFunnel");
    const mouthPucker = blendshape(categories, "mouthPucker");
    const mouthLeft = blendshape(categories, "mouthLeft");
    const mouthRight = blendshape(categories, "mouthRight");
    const mouthLowerDownLeft = blendshape(categories, "mouthLowerDownLeft");
    const mouthLowerDownRight = blendshape(categories, "mouthLowerDownRight");
    const mouthUpperUpLeft = blendshape(categories, "mouthUpperUpLeft");
    const mouthUpperUpRight = blendshape(categories, "mouthUpperUpRight");
    const mouthDimpleLeft = blendshape(categories, "mouthDimpleLeft");
    const mouthDimpleRight = blendshape(categories, "mouthDimpleRight");
    const rawLateralLipScore = clamp01(
      mouthFunnel * 0.8 +
      mouthPucker * 0.8 +
      (mouthLeft + mouthRight) * 0.5 +
      (mouthLowerDownLeft + mouthLowerDownRight) * 0.4 +
      (mouthUpperUpLeft + mouthUpperUpRight) * 0.4 +
      (mouthDimpleLeft + mouthDimpleRight) * 0.3,
    );

    const smileScore = clamp01((blendshape(categories, "mouthSmileLeft") + blendshape(categories, "mouthSmileRight")) / 2);
    const center = averageLandmark(landmarks);
    const pose = headPoseFromMatrix(result.facialTransformationMatrixes?.[0]);

    const frame: HistoryFrame = {
      timestamp,
      mouthOpenScore: rawMouthOpenScore,
      blinkScore,
      headYaw: pose.yaw,
      headPitch: pose.pitch,
      headRoll: pose.roll,
      centerX: center.x,
      centerY: center.y,
    };

    const previous = this.history[this.history.length - 1];
    const rawHeadMovementIntensity = movementIntensity(frame, previous);

    // Delta-based vertical lip movement (jaw open/close) combined with lateral scores
    const rawVerticalLipScore = clamp01(previous ? Math.abs(rawMouthOpenScore - previous.mouthOpenScore) * 7 : 0);
    const rawLipMovementScore = clamp01(rawVerticalLipScore * 0.6 + rawLateralLipScore * 0.4);

    // Apply EMA smoothing to reduce per-frame jitter
    this.smoothedMouthOpen = ema(rawMouthOpenScore, this.smoothedMouthOpen);
    this.smoothedLipMovement = ema(rawLipMovementScore, this.smoothedLipMovement);
    this.smoothedHeadMovement = ema(rawHeadMovementIntensity, this.smoothedHeadMovement);
    this.smoothedLateralLip = ema(rawLateralLipScore, this.smoothedLateralLip);

    const mouthOpenScore = this.smoothedMouthOpen;
    const lipMovementScore = this.smoothedLipMovement;
    const lateralLipScore = this.smoothedLateralLip;
    const headMovementIntensity = this.smoothedHeadMovement;

    const blinking = blinkScore > 0.52;
    if (blinking && !this.wasBlinking) this.blinkEvents.push(timestamp);
    this.wasBlinking = blinking;
    this.blinkEvents = this.blinkEvents.filter((eventAt) => timestamp - eventAt <= 60000);

    this.history.push(frame);
    this.history = this.history.filter((item) => timestamp - item.timestamp <= HISTORY_MS);

    // Lower thresholds for mouth/lip activity to catch softer speech
    const mouthActive = mouthOpenScore > 0.20 || lipMovementScore > 0.12 || lateralLipScore > 0.15;
    if (mouthActive) this.lastMouthActiveAt = timestamp;
    const visualActive = headMovementIntensity > 0.08 || lipMovementScore > 0.10 || blinking;
    if (visualActive) this.lastVisualActiveAt = timestamp;

    const direction = lookDirection(pose.yaw, pose.pitch, center.x, center.y);
    const lookingAwayScore = clamp01(Math.max(Math.abs(pose.yaw) / 28, Math.abs(pose.pitch) / 28, Math.abs(center.x - 0.5) * 2.1));
    const lookingAway = direction !== "center" && lookingAwayScore > 0.38;
    const mouthStillnessMs = timestamp - this.lastMouthActiveAt;
    const visualStillnessMs = timestamp - this.lastVisualActiveAt;
    const headMoving = headMovementIntensity > 0.1;
    const mouthOpen = mouthOpenScore > 0.22;
    const lipMoving = lipMovementScore > 0.12 || lateralLipScore > 0.14;
    const laughingLikely = smileScore > 0.52 && mouthOpenScore > 0.28;
    const engagement =
      !landmarks.length ? "no_face" :
      visualStillnessMs > 5000 ? "inactive" :
      lookingAway ? "looking_away" :
      lipMoving || headMoving ? "thinking" :
      "engaged";

    return {
      faceDetected: true,
      faceConfidence: 0.92,
      blinking,
      blinkRateApprox: clamp01(this.blinkEvents.length / 30),
      mouthOpen,
      mouthOpenScore,
      lipMoving,
      lipMovementScore,
      lateralLipScore,
      mouthStillnessMs,
      smiling: smileScore > 0.32,
      smileScore,
      laughingLikely,
      lookingAway,
      lookDirection: direction,
      lookingAwayScore,
      headMoving,
      headMovementIntensity,
      headYaw: pose.yaw,
      headPitch: pose.pitch,
      headRoll: pose.roll,
      visualStillnessMs,
      engagement,
      lightingScore: 1,
      timestamp,
    };
  }
}

export function extractFaceSignalState(result: FaceLandmarkerResult | null, timestamp = Date.now()) {
  const extractor = new FaceFeatureExtractor();
  return extractor.extract(result, timestamp);
}
