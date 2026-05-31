import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Optional

from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


ROOT = Path(__file__).resolve().parent
DEFAULT_DATA_PATH = ROOT / "sample_training_data.jsonl"
FEATURES = ["wordsPerMinute", "fillerWordRate", "averagePauseMs", "wordCount", "silenceAfterMs", "speechDurationMs"]


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


def baseline_pause(row: dict) -> str:
    silence = float(row.get("silenceAfterMs") or 0)
    if row.get("detectedConfusion") or row.get("confusionMarkers"):
        return "confused"
    if silence > 9000:
        return "abandoned"
    if silence > 2200 or float(row.get("fillerWordRate") or 0) > 0.08:
        return "thinking"
    return "finished"


def baseline_user_state(row: dict) -> str:
    if row.get("detectedConfusion") or row.get("confusionMarkers"):
        return "confused"
    if row.get("detectedDefensiveness") or row.get("defensivenessMarkers"):
        return "defensive"
    if float(row.get("wordsPerMinute") or 0) > 175 and float(row.get("averagePauseMs") or 0) < 650:
        return "rushing"
    if int(row.get("wordCount") or 0) > 180:
        return "overexplaining"
    if float(row.get("fillerWordRate") or 0) > 0.08 or float(row.get("averagePauseMs") or 0) > 2600:
        return "hesitant"
    return "calm"


def evaluate_target(rows: list[dict], target: str, baseline_fn) -> dict:
    labeled = [row for row in rows if row.get(target)]
    if len(labeled) < 4:
        return {"target": target, "error": "Need at least 4 labeled rows.", "sampleCount": len(labeled)}
    y = [row[target] for row in labeled]
    test_size, stratify = split_options(y)
    x_train, x_test, y_train, y_test, rows_train, rows_test = train_test_split(vectorize(labeled), y, labeled, test_size=test_size, random_state=42, stratify=stratify)
    baseline_predictions = [baseline_fn(row) for row in rows_test]
    baseline_accuracy = accuracy_score(y_test, baseline_predictions)
    candidates = [
        ("logistic_regression", LogisticRegression(max_iter=1000)),
        ("random_forest", RandomForestClassifier(n_estimators=120, random_state=42)),
        ("gradient_boosting", GradientBoostingClassifier(random_state=42)),
    ]
    results = []
    labels = sorted(set(y))
    for name, estimator in candidates:
        pipeline = Pipeline([("scale", StandardScaler()), ("classifier", estimator)])
        pipeline.fit(x_train, y_train)
        predictions = pipeline.predict(x_test)
        precision, recall, _f1, _support = precision_recall_fscore_support(y_test, predictions, labels=labels, zero_division=0)
        accuracy = accuracy_score(y_test, predictions)
        results.append({
            "modelType": name,
            "accuracy": round(float(accuracy), 4),
            "baselineAccuracy": round(float(baseline_accuracy), 4),
            "precision": {label: round(float(value), 4) for label, value in zip(labels, precision)},
            "recall": {label: round(float(value), 4) for label, value in zip(labels, recall)},
            "confusionMatrix": confusion_matrix(y_test, predictions, labels=labels).tolist(),
            "passedMinimumThreshold": bool(accuracy >= baseline_accuracy + 0.03),
        })
    return {
        "target": target,
        "sampleCount": len(labeled),
        "labelDistribution": dict(Counter(y)),
        "labels": labels,
        "features": FEATURES,
        "models": results,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default=str(DEFAULT_DATA_PATH), help="Anonymized JSONL export path")
    args = parser.parse_args()
    rows = load_rows(Path(args.data))
    for row in rows:
        row["pauseType"] = row.get("pauseType") or row.get("detectedPauseType")
        row["userState"] = row.get("userState") or row.get("detectedUserState")
    report = {
        "pause_classifier": evaluate_target(rows, "pauseType", baseline_pause),
        "user_state_classifier": evaluate_target(rows, "userState", baseline_user_state),
        "deepLearning": "TODO only: do not use until a large, diverse, balanced labeled dataset and evaluation pipeline prove improvement over classical ML.",
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
