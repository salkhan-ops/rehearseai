from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from math import sqrt
from typing import Optional


@dataclass
class ProsodyFeatures:
    rms_energy: float = 0.0
    f0_hz: float = 0.0


class ProsodyExtractor:
    """Extract tiny prosody features and immediately release the raw chunk."""

    def extract(self, audio_chunk: bytes) -> ProsodyFeatures:
        try:
            return self._extract_with_librosa(audio_chunk)
        except Exception:
            return self._fallback_rms(audio_chunk)
        finally:
            audio_chunk = b""

    def _extract_with_librosa(self, audio_chunk: bytes) -> ProsodyFeatures:
        import librosa  # type: ignore
        import numpy as np  # type: ignore

        samples, sample_rate = librosa.load(BytesIO(audio_chunk), sr=None, mono=True)
        if samples.size == 0:
            return ProsodyFeatures()
        rms = float(np.sqrt(np.mean(np.square(samples))))
        f0_values = librosa.yin(samples, fmin=50, fmax=500, sr=sample_rate)
        voiced = f0_values[np.isfinite(f0_values)]
        f0 = float(np.median(voiced)) if voiced.size else 0.0
        return ProsodyFeatures(rms_energy=round(rms, 6), f0_hz=round(f0, 2))

    def _fallback_rms(self, audio_chunk: bytes) -> ProsodyFeatures:
        if not audio_chunk:
            return ProsodyFeatures()
        sample = audio_chunk[:4096]
        centered = [(byte - 128) / 128 for byte in sample]
        rms = sqrt(sum(value * value for value in centered) / max(1, len(centered)))
        return ProsodyFeatures(rms_energy=round(min(1.0, rms), 6), f0_hz=0.0)
