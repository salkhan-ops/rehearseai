import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import type { MediaPipeFaceStatus } from "./faceSignalTypes";

const TASKS_VERSION = "0.10.35";
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VERSION}/wasm`;
const FACE_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

export type FaceLandmarkerServiceSnapshot = {
  status: MediaPipeFaceStatus;
  mediaPipeLoaded: boolean;
  cameraPermission: "unknown" | "prompt" | "granted" | "denied" | "error";
  error: string;
};

type StatusListener = (snapshot: FaceLandmarkerServiceSnapshot) => void;

class FaceLandmarkerService {
  private landmarker: FaceLandmarker | null = null;
  private initPromise: Promise<FaceLandmarker> | null = null;
  private stream: MediaStream | null = null;
  private status: MediaPipeFaceStatus = "idle";
  private cameraPermission: FaceLandmarkerServiceSnapshot["cameraPermission"] = "unknown";
  private error = "";
  private listeners = new Set<StatusListener>();

  subscribe(listener: StatusListener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  snapshot(): FaceLandmarkerServiceSnapshot {
    return {
      status: this.status,
      mediaPipeLoaded: Boolean(this.landmarker),
      cameraPermission: this.cameraPermission,
      error: this.error,
    };
  }

  private setSnapshot(next: Partial<FaceLandmarkerServiceSnapshot>) {
    if (next.status) this.status = next.status;
    if (next.cameraPermission) this.cameraPermission = next.cameraPermission;
    if (typeof next.error === "string") this.error = next.error;
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  async initFaceLandmarker() {
    if (this.landmarker) return this.landmarker;
    if (this.initPromise) return this.initPromise;
    if (typeof window === "undefined") {
      this.setSnapshot({ status: "unavailable", error: "MediaPipe is only available in the browser." });
      throw new Error("MediaPipe is only available in the browser.");
    }

    this.setSnapshot({ status: "loading_model", error: "" });
    this.initPromise = (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
        const options = {
          baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL_URL,
            delegate: "GPU" as const,
          },
          runningMode: "VIDEO" as const,
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
        };
        try {
          this.landmarker = await FaceLandmarker.createFromOptions(vision, options);
        } catch {
          this.landmarker = await FaceLandmarker.createFromOptions(vision, {
            ...options,
            baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL_URL, delegate: "CPU" },
          });
        }
        this.setSnapshot({ status: this.stream ? "active" : "idle", error: "" });
        return this.landmarker;
      } catch (error) {
        this.initPromise = null;
        this.setSnapshot({
          status: "error",
          error: error instanceof Error ? error.message : "MediaPipe Face Landmarker failed to load.",
        });
        throw error;
      }
    })();
    return this.initPromise;
  }

  async startCamera(videoElement: HTMLVideoElement) {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.setSnapshot({ status: "unavailable", error: "Camera is not available in this browser." });
      throw new Error("Camera is not available in this browser.");
    }

    await this.initFaceLandmarker();
    this.setSnapshot({ status: "requesting_permission", cameraPermission: "prompt", error: "" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.stream = stream;
      videoElement.srcObject = stream;
      videoElement.muted = true;
      videoElement.playsInline = true;
      await videoElement.play().catch(() => undefined);
      this.setSnapshot({ status: "active", cameraPermission: "granted", error: "" });
      return stream;
    } catch (error) {
      this.stream = null;
      this.setSnapshot({
        status: "error",
        cameraPermission: error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") ? "denied" : "error",
        error: error instanceof Error ? error.message : "Camera permission was not granted.",
      });
      throw error;
    }
  }

  stopCamera() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.setSnapshot({ status: this.landmarker ? "idle" : "idle" });
  }

  detectFrame(videoElement: HTMLVideoElement): FaceLandmarkerResult | null {
    if (!this.landmarker || videoElement.readyState < 2) return null;
    const result = this.landmarker.detectForVideo(videoElement, performance.now());
    this.setSnapshot({ status: result.faceLandmarks.length ? "active" : "no_face" });
    return result;
  }

  dispose() {
    this.stopCamera();
    this.landmarker?.close();
    this.landmarker = null;
    this.initPromise = null;
    this.setSnapshot({ status: "idle", error: "" });
  }
}

export function initFaceLandmarker() {
  return faceLandmarkerService.initFaceLandmarker();
}

export function startCamera(videoElement: HTMLVideoElement) {
  return faceLandmarkerService.startCamera(videoElement);
}

export function stopCamera() {
  return faceLandmarkerService.stopCamera();
}

export function detectFrame(videoElement: HTMLVideoElement) {
  return faceLandmarkerService.detectFrame(videoElement);
}

export function dispose() {
  return faceLandmarkerService.dispose();
}

export const faceLandmarkerService = new FaceLandmarkerService();
