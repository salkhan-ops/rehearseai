from pathlib import Path
from typing import Any, Optional, Tuple


BASE_DIR = Path(__file__).resolve().parents[2]
PAUSE_MODEL_PATH = BASE_DIR / "ml" / "models" / "pause_classifier.joblib"
USER_STATE_MODEL_PATH = BASE_DIR / "ml" / "models" / "user_state_classifier.joblib"
MIN_MODEL_CONFIDENCE = 0.58


def _load_joblib_model(path: Path) -> Optional[Any]:
    if not path.exists():
        return None
    try:
        import joblib

        return joblib.load(path)
    except Exception:
        return None


def _approved_model_bundle(path: Path) -> Optional[Any]:
    model = _load_joblib_model(path)
    if not model:
        return None
    if isinstance(model, dict):
        metadata = model.get("metadata") or {}
        if not metadata.get("passedMinimumThreshold", False):
            return None
    return model


def _predict_from_bundle(bundle: Any, features: dict) -> Tuple[Optional[str], float]:
    model = bundle.get("pipeline") if isinstance(bundle, dict) and "pipeline" in bundle else bundle
    ordered_input = [features]
    if isinstance(bundle, dict) and bundle.get("features"):
        ordered_input = [[features.get(item, 0) for item in bundle["features"]]]
    try:
        prediction = str(model.predict(ordered_input)[0])
        confidence = 1.0
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(ordered_input)[0]
            confidence = float(max(probabilities))
        if confidence < MIN_MODEL_CONFIDENCE:
            return None, confidence
        return prediction, confidence
    except Exception:
        return None, 0.0


def predict_pause_type(features: dict) -> str:
    silence_ms = int(features.get("silenceMs") or features.get("silenceBeforeMs") or features.get("silenceAfterMs") or 0)
    words_per_minute = float(features.get("wordsPerMinute") or 0)
    filler_rate = float(features.get("fillerRate") or features.get("fillerWordRate") or 0)
    last_words = str(features.get("lastWords") or "").lower()
    baseline_pause_ms = int(features.get("baselineAveragePauseMs") or 900)
    long_pause_threshold_ms = int(features.get("baselineLongPauseThresholdMs") or max(2200, baseline_pause_ms * 2.4))
    abandoned_threshold_ms = max(9000, long_pause_threshold_ms * 2)
    thinking_threshold_ms = max(1800, int(baseline_pause_ms * 1.35))
    if silence_ms > abandoned_threshold_ms and words_per_minute < 40:
        return "abandoned"
    if any(marker in last_words for marker in ["what do you mean", "can you repeat", "i'm confused", "i am confused"]):
        return "confused"
    if any(marker in last_words for marker in ["wait", "let me think", "one second", "hold on", "give me a moment"]):
        return "thinking"
    if silence_ms > thinking_threshold_ms * 1.35:
        return "thinking"
    model = _approved_model_bundle(PAUSE_MODEL_PATH)
    if model:
        prediction, _confidence = _predict_from_bundle(model, features)
        if prediction:
            return prediction
    if silence_ms > thinking_threshold_ms or filler_rate > float(features.get("baselineFillerWordRate", 0.04)) * 2.2:
        return "thinking"
    return "finished"


def predict_user_state(features: dict) -> str:
    words_per_minute = float(features.get("wordsPerMinute") or 0)
    filler_rate = float(features.get("fillerRate") or features.get("fillerWordRate") or 0)
    response_length = int(features.get("responseLength") or features.get("wordCount") or 0)
    confusion_markers = int(features.get("confusionMarkers") or 0)
    defensiveness_markers = int(features.get("defensivenessMarkers") or 0)
    average_pause_ms = int(features.get("averagePauseMs") or 0)
    baseline_wpm = float(features.get("baselineAverageWordsPerMinute") or 125)
    baseline_pause_ms = int(features.get("baselineAveragePauseMs") or 900)
    baseline_filler_rate = float(features.get("baselineFillerWordRate") or 0.04)
    baseline_turn_words = int(features.get("baselineAverageTurnWordCount") or 55)
    rushing_threshold = max(160, baseline_wpm * 1.35)
    overexplaining_threshold = max(140, baseline_turn_words * 2.25)
    hesitation_pause_threshold = max(2400, baseline_pause_ms * 2.2)
    hesitation_filler_threshold = max(0.08, baseline_filler_rate * 2.2)
    if confusion_markers:
        return "confused"
    if defensiveness_markers:
        return "defensive"
    if words_per_minute > rushing_threshold and average_pause_ms < max(500, baseline_pause_ms * 0.72):
        return "rushing"
    if response_length > overexplaining_threshold:
        return "overexplaining"
    model = _approved_model_bundle(USER_STATE_MODEL_PATH)
    if model:
        prediction, _confidence = _predict_from_bundle(model, features)
        if prediction:
            return prediction
    if filler_rate > hesitation_filler_threshold or average_pause_ms > hesitation_pause_threshold:
        return "hesitant"
    return "calm"


def recommend_ai_timing_action(features: dict) -> str:
    user_state = str(features.get("userState") or predict_user_state(features))
    pause_type = str(features.get("pauseType") or predict_pause_type(features))
    if pause_type == "finished":
        return "respond"
    if pause_type == "confused" or user_state == "confused":
        return "clarify"
    if user_state == "overexplaining":
        return "interrupt"
    return "wait"
