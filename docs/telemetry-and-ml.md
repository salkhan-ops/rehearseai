# Conversation Telemetry and Future ML

RehearseAI collects privacy-aware conversation signals so the Conversation Coordination Engine can improve timing, interruptions, and support under pressure. The pipeline is for data collection and labeling only; no model is trained in production yet.
The full application context is documented in `architecture.md`.

## What Is Collected

The telemetry layer stores behavioral features in `conversationTelemetry/{telemetryId}`:

- timing data such as speech duration, silence before/after a turn, average pause, longest pause, and words per minute
- transcript-derived features such as word count, filler count, filler rate, repeated phrases, sentence count, and average sentence length
- conversation signals such as turn index, response latency, AI wait time, interruption flags, recommended AI tone, and recommended response length
- rule-based labels such as user state, pressure state, pause type, confusion, overexplaining, defensiveness, and rushing
- outcome labels such as completed turn, abandoned session, report generated, and report scores where available

Session-level outcomes are stored in `sessionOutcomes/{outcomeId}` so future classifiers can learn from outcomes, not only individual speech features.

## What Is Not Collected By Default

Raw audio is not stored by default. The product should prefer timing data and transcript-derived features over private audio. The user setting `privacySettings.allowRawAudioStorage` defaults to `false` and should remain an advanced option.

## Standards Alignment

The telemetry design follows data minimization and purpose limitation principles:

- Collect only features needed for timing, coaching, and model-improvement evaluation.
- Keep raw audio disabled by default.
- Use consent settings before writing telemetry or training exports.
- Store expiration metadata for detailed telemetry.
- Export anonymized features and labels rather than direct identifiers.
- Evaluate future classifiers before runtime use and fall back to rules when confidence is low.

## Consent Settings

Users have privacy settings on `users/{uid}`:

- `allowTelemetry`: default `true`
- `allowModelImprovement`: default `true`
- `allowRawAudioStorage`: default `false`

If telemetry or model improvement is disabled, the backend skips `conversationTelemetry` writes and keeps only minimal operational logs needed for the active session.

## How It Improves Timing

The Conversation Coordination Engine can use features like pause length, filler rate, speaking pace, and confusion markers to decide whether the AI should wait, respond, clarify, or politely interrupt. Current behavior is rule-based.

## Personal Speech Profile

Each consented user can build a lightweight personal speech profile in `voiceProfiles/{userId}`. It is not a biometric voice identity profile and does not require raw audio. It stores rolling behavioral baselines such as:

- average words per minute
- average pause length
- short and long pause thresholds
- preferred AI wait time
- average speech duration
- average turn word count
- filler-word rate
- confusion and defensiveness marker rates
- personalized rushing and overexplaining thresholds

The profile updates incrementally after each eligible turn using a small exponential moving average. Rule-based classifiers then compare a new turn against the user's own baseline, so a naturally slow speaker or long-pausing thinker is not treated the same as someone who is freezing under pressure.

During a live session, RehearseAI also keeps an in-memory baseline keyed by session and user. That lets the AI adjust wait/respond/interrupt/soften/challenge behavior immediately inside the session without training a persistent model from one short interaction.

At session end, the backend consolidates the session's detailed turn telemetry into summarized `voiceProfiles/{userId}` fields such as `sessionCount`, `averageWordsPerMinute`, `averagePauseMs`, `longPauseThresholdMs`, `fillerWordRate`, `overExplainWordThreshold`, `hesitationMarkerRate`, `confusionMarkerRate`, and `defensiveMarkerRate`.

## Temporary Retention

Detailed `conversationTelemetry/{telemetryId}` records include:

- `expiresAt`
- `retainForTraining`
- `anonymized`
- `rawAudioStored`

Defaults are privacy-preserving: `rawAudioStored` is `false`, telemetry expires after 30 days, and summarized profile learning remains in `voiceProfiles/{userId}`.

Run `backend/scripts/cleanup_expired_telemetry.py` from a scheduled job to delete expired detailed telemetry.

## Labeling

Admins can label anonymized samples at `/admin/telemetry-labels`. Labels are stored in `telemetryLabels/{labelId}` with:

- `pauseType`: `thinking`, `finished`, `confused`, or `abandoned`
- `userState`: `calm`, `hesitant`, `confused`, `defensive`, `rushing`, or `overexplaining`
- `aiActionQuality`: `good`, `too_early`, `too_late`, `too_soft`, or `too_hard`

## Training Export

`POST /api/telemetry/export-training-data` exports JSONL or CSV for admins only. Exports remove email, display name, and direct user identifiers, and include an `anonymousUserId` hash plus features and labels.

## Future Classifiers

Placeholder files live in `backend/ml/`:

- `train_pause_classifier.py`
- `train_user_state_classifier.py`
- `evaluate_classifiers.py`
- `predict.py`
- `requirements-ml.txt`
- `sample_training_data.jsonl`

Runtime prediction is exposed through `backend/app/services/ml_classifier_service.py`. If trained `joblib` models exist under `backend/ml/models/`, they can be loaded; otherwise rule-based fallbacks are used.

Training is offline/admin-only. Scripts train classical models only: logistic regression, random forest, and gradient boosting. Saved model bundles include metadata with `trainedAt`, `sampleCount`, `labelDistribution`, `accuracy`, `precision`, `recall`, `confusionMatrix`, `baselineAccuracy`, and `passedMinimumThreshold`.

Runtime uses a model only when metadata says it passed the minimum threshold and prediction confidence is high enough. Otherwise it falls back to the personal-baseline rules.

Deep learning is intentionally deferred until there is a large, diverse, balanced labeled dataset and an evaluation pipeline proving a clear improvement over classical ML.
