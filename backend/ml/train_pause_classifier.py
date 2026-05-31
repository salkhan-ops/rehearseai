import argparse
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import joblib
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


ROOT = Path(__file__).resolve().parent
DEFAULT_DATA_PATH = ROOT / "sample_training_data.jsonl"
MODEL_PATH = ROOT / "models" / "pause_classifier.joblib"
FEATURES = ["silenceAfterMs", "speechDurationMs", "wordsPerMinute", "fillerWordRate", "averagePauseMs", "wordCount"]
MIN_SAMPLES = 80
MIN_ACCURACY_LIFT = 0.03


def load_rows(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def vectorize(rows: list[dict]) -> list[list[float]]:
    return [[float(row.get(feature) or 0) for feature in FEATURES] for row in rows]


def split_options(labels: list[str]) -> tuple[float, Optional[list[str]]]:
    class_count = len(set(labels))
    test_count = max(class_count, round(len(labels) * 0.25))
    if test_count >= len(labels):
        test_count = max(1, len(labels) - class_count)
    test_size = max(0.25, test_count / len(labels))
    stratify = labels if min(Counter(labels).values()) >= 2 and test_count >= class_count else None
    return test_size, stratify


def rule_baseline(row: dict) -> str:
    silence = float(row.get("silenceAfterMs") or 0)
    if row.get("detectedConfusion") or row.get("confusionMarkers"):
        return "confused"
    if silence > 9000:
        return "abandoned"
    if silence > 2200 or float(row.get("fillerWordRate") or 0) > 0.08:
        return "thinking"
    return "finished"


def score_model(name: str, estimator, x_train, x_test, y_train, y_test, baseline_accuracy: float) -> tuple[dict, Pipeline]:
    pipeline = Pipeline([("scale", StandardScaler()), ("classifier", estimator)])
    pipeline.fit(x_train, y_train)
    predictions = pipeline.predict(x_test)
    labels = sorted(set(y_train) | set(y_test))
    precision, recall, _f1, _support = precision_recall_fscore_support(y_test, predictions, labels=labels, zero_division=0)
    accuracy = accuracy_score(y_test, predictions)
    metrics = {
        "modelType": name,
        "accuracy": round(float(accuracy), 4),
        "precision": {label: round(float(value), 4) for label, value in zip(labels, precision)},
        "recall": {label: round(float(value), 4) for label, value in zip(labels, recall)},
        "confusionMatrix": confusion_matrix(y_test, predictions, labels=labels).tolist(),
        "labels": labels,
        "baselineAccuracy": round(float(baseline_accuracy), 4),
        "passedMinimumThreshold": bool(accuracy >= baseline_accuracy + MIN_ACCURACY_LIFT and len(y_train) + len(y_test) >= MIN_SAMPLES),
    }
    return metrics, pipeline


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default=str(DEFAULT_DATA_PATH), help="Anonymized JSONL export path")
    args = parser.parse_args()
    rows = [row for row in load_rows(Path(args.data)) if row.get("pauseType") or row.get("detectedPauseType")]
    for row in rows:
        row["pauseType"] = row.get("pauseType") or row.get("detectedPauseType")
    if len(rows) < 4:
        raise SystemExit("Need at least 4 labeled rows to train.")

    x = vectorize(rows)
    y = [row["pauseType"] for row in rows]
    test_size, stratify = split_options(y)
    x_train, x_test, y_train, y_test, rows_train, rows_test = train_test_split(x, y, rows, test_size=test_size, random_state=42, stratify=stratify)
    baseline_predictions = [rule_baseline(row) for row in rows_test]
    baseline_accuracy = accuracy_score(y_test, baseline_predictions)
    candidates = [
        ("logistic_regression", LogisticRegression(max_iter=1000)),
        ("random_forest", RandomForestClassifier(n_estimators=120, random_state=42)),
        ("gradient_boosting", GradientBoostingClassifier(random_state=42)),
    ]
    scored = [score_model(name, estimator, x_train, x_test, y_train, y_test, baseline_accuracy) for name, estimator in candidates]
    best_metrics, best_pipeline = max(scored, key=lambda item: item[0]["accuracy"])
    metadata = {
        **best_metrics,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "sampleCount": len(rows),
        "labelDistribution": dict(Counter(y)),
        "featureVersion": "speech_features_v1",
        "features": FEATURES,
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"features": FEATURES, "pipeline": best_pipeline, "metadata": metadata}, MODEL_PATH)
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
