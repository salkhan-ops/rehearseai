# RehearseAI ML Classifier Placeholders

This folder is a scaffold for future internal classifiers trained from consented conversation telemetry.
See `../../docs/telemetry-and-ml.md` and `../../docs/architecture.md` for the privacy and governance model.

No model is trained or required today. Runtime prediction uses `backend/app/services/ml_classifier_service.py`, which loads a future `joblib` model if present and otherwise falls back to rule-based heuristics.

Planned targets:

- `pause_classifier`: predicts `thinking`, `finished`, `confused`, or `abandoned`.
- `user_state_classifier`: predicts `calm`, `hesitant`, `confused`, `defensive`, `rushing`, or `overexplaining`.
- `ai_timing_policy`: recommends `wait`, `respond`, `interrupt`, or `clarify`.

Training exports must be anonymized and include features plus labels only. Raw audio is disabled by default.

Runtime use requirements:

- Load a model only when its metadata shows it passed the minimum evaluation threshold.
- Prefer rule-based fallbacks when confidence is low.
- Keep training offline/admin-only.
- Do not train on raw audio unless a future explicit consent and retention design is approved.
