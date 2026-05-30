"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeConversationCoordination, completeVoiceCalibration, getVoiceProfile, startVoiceCalibration } from "@/lib/api";
import type { CalibrationStart, ConversationAnalyzePayload, ConversationCoordinationState, VoiceProfile } from "@/lib/types";

type Options = {
  userId: string;
  sessionId?: string;
  token?: string | null;
  enabled?: boolean;
};

export function useConversationCoordination({ userId, sessionId, token, enabled = true }: Options) {
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [state, setState] = useState<ConversationCoordinationState | null>(null);
  const [calibration, setCalibration] = useState<CalibrationStart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastAnalyzeAtRef = useRef(0);

  const loadProfile = useCallback(async () => {
    if (!enabled || !userId) return null;
    try {
      const next = await getVoiceProfile(userId, token);
      setProfile(next);
      return next;
    } catch {
      setProfile(null);
      return null;
    }
  }, [enabled, token, userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const startCalibration = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const next = await startVoiceCalibration(userId, token);
      setCalibration(next);
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start calibration.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  const completeCalibration = useCallback(async (payload: { transcript: string; speechDurationMs: number; pausesMs?: number[] }) => {
    setError("");
    setLoading(true);
    try {
      const next = await completeVoiceCalibration({ userId, ...payload }, token);
      setProfile(next);
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not complete calibration.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  const analyze = useCallback(async (payload: Partial<ConversationAnalyzePayload>, throttleMs = 700) => {
    if (!enabled || !userId) return null;
    const now = Date.now();
    if (throttleMs && now - lastAnalyzeAtRef.current < throttleMs) return state;
    lastAnalyzeAtRef.current = now;
    try {
      const next = await analyzeConversationCoordination({ userId, sessionId, ...payload }, token);
      setState(next);
      return next;
    } catch {
      return state;
    }
  }, [enabled, sessionId, state, token, userId]);

  return {
    profile,
    state,
    calibration,
    loading,
    error,
    longPauseMs: profile?.longPauseThresholdMs,
    preferredAiWaitMs: profile?.preferredAiWaitMs,
    loadProfile,
    startCalibration,
    completeCalibration,
    analyze,
  };
}
