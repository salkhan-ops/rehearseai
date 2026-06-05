# Local Pause ML

This folder contains the local pause-intent interface used by camera-assisted timing.

Current behavior is rule-based only. It does not ship a trained deep learning model and does not claim to infer emotion, medical, or mental-health state.

Future implementations can replace `predictPauseIntent(features)` with a lightweight local model such as logistic regression, a small decision tree, ONNX, or TensorFlow.js once enough consented numeric timing data exists.
