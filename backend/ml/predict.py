from pathlib import Path
from typing import Any, Optional


ROOT = Path(__file__).resolve().parent
PAUSE_MODEL_PATH = ROOT / "models" / "pause_classifier.joblib"
USER_STATE_MODEL_PATH = ROOT / "models" / "user_state_classifier.joblib"
MIN_CONFIDENCE = 0.58


def _load_model(path: Path) -> Optional[Any]:
    if not path.exists():
        return None
    try:
        import joblib

        return joblib.load(path)
    except Exception:
        return None


def _approved(path: Path) -> Optional[Any]:
    model = _load_model(path)
    if isinstance(model, dict) and not (model.get("metadata") or {}).get("passedMinimumThreshold", False):
        return None
    return model


def _predict_bundle(bundle: Any, features: dict) -> Optional[str]:
    model = bundle.get("pipeline") if isinstance(bundle, dict) and "pipeline" in bundle else bundle
    rows = [features]
    if isinstance(bundle, dict) and bundle.get("features"):
        rows = [[features.get(item, 0) for item in bundle["features"]]]
    prediction = str(model.predict(rows)[0])
    if hasattr(model, "predict_proba"):
        confidence = float(max(model.predict_proba(rows)[0]))
        if confidence < MIN_CONFIDENCE:
            return None
    return prediction


def predict_pause(features: dict) -> str:
    model = _approved(PAUSE_MODEL_PATH)
    if model:
        prediction = _predict_bundle(model, features)
        if prediction:
            return prediction
    silence = int(features.get("silenceAfterMs", 0))
    if silence > 9000:
        return "abandoned"
    if int(features.get("confusionMarkers", 0)):
        return "confused"
    if silence > 2200:
        return "thinking"
    return "finished"


def predict_user_state(features: dict) -> str:
    model_bundle = _approved(USER_STATE_MODEL_PATH)
    if model_bundle:
        prediction = _predict_bundle(model_bundle, features)
        if prediction:
            return prediction
    if int(features.get("confusionMarkers", 0)):
        return "confused"
    if int(features.get("defensivenessMarkers", 0)):
        return "defensive"
    if float(features.get("wordsPerMinute", 0)) > 175:
        return "rushing"
    if int(features.get("wordCount", 0)) > 180:
        return "overexplaining"
    if float(features.get("fillerWordRate", 0)) > 0.08:
        return "hesitant"
    return "calm"
