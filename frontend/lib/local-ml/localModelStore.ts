export type LocalModelMetadata = {
  version: string;
  kind: "rules" | "logistic_regression" | "decision_tree" | "onnx" | "tensorflowjs";
  updatedAt: string;
  trained: boolean;
};

const key = "rehearseai.localPauseModel.metadata";

export const defaultLocalModelMetadata: LocalModelMetadata = {
  version: "rules-v1",
  kind: "rules",
  updatedAt: "2026-06-05",
  trained: false,
};

export function getLocalModelMetadata(): LocalModelMetadata {
  if (typeof window === "undefined") return defaultLocalModelMetadata;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? { ...defaultLocalModelMetadata, ...JSON.parse(stored) } : defaultLocalModelMetadata;
  } catch {
    return defaultLocalModelMetadata;
  }
}

export function saveLocalModelMetadata(metadata: LocalModelMetadata) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(metadata));
}
