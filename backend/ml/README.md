# RehearseAI ML Classifier Placeholders

This folder is a scaffold for future internal classifiers trained from consented conversation telemetry.

No model is trained or required today. Runtime prediction uses `backend/app/services/ml_classifier_service.py`, which loads a future `joblib` model if present and otherwise falls back to rule-based heuristics.

Planned targets:

- `pause_classifier`: predicts `thinking`, `finished`, `confused`, or `abandoned`.
- `user_state_classifier`: predicts `calm`, `hesitant`, `confused`, `defensive`, `rushing`, or `overexplaining`.
- `ai_timing_policy`: recommends `wait`, `respond`, `interrupt`, or `clarify`.

Training exports must be anonymized and include features plus labels only. Raw audio is disabled by default.
