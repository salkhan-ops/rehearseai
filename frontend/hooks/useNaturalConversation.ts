"use client";

import { useCallback, useReducer, useRef } from "react";
import {
  transitionNaturalConversationState,
  type NaturalConversationEvent,
  type NaturalConversationState,
} from "@/lib/conversation/conversationStateMachine";
import { naturalTurnTakingEngine, type NaturalTurnTakingInput, type NaturalTurnTakingResult } from "@/lib/conversation/naturalTurnTakingEngine";

export function useNaturalConversation() {
  const [state, dispatchBase] = useReducer(
    (current: NaturalConversationState, event: NaturalConversationEvent) => transitionNaturalConversationState(current, event),
    "idle",
  );
  const lastTranscriptUpdateRef = useRef(0);
  const lastDecisionRef = useRef<NaturalTurnTakingResult | null>(null);

  const dispatch = useCallback((event: NaturalConversationEvent) => {
    dispatchBase(event);
  }, []);

  const evaluateTurn = useCallback((input: Omit<NaturalTurnTakingInput, "lastTranscriptUpdateMs">) => {
    const hasTranscript = Boolean(`${input.finalTranscript || ""} ${input.interimTranscript || ""}`.trim());
    if (hasTranscript) lastTranscriptUpdateRef.current = Date.now();
    const decision = naturalTurnTakingEngine({ ...input, lastTranscriptUpdateMs: lastTranscriptUpdateRef.current });
    lastDecisionRef.current = decision;
    if (decision.decision === "interrupt_ai") dispatchBase("interrupt");
    else if (decision.decision === "send_now") dispatchBase("send_ready");
    else if (decision.decision === "wait_longer" || decision.decision === "gentle_prompt") dispatchBase("silence_detected");
    else if (hasTranscript) dispatchBase("speech_detected");
    return decision;
  }, []);

  const reset = useCallback(() => {
    lastTranscriptUpdateRef.current = 0;
    lastDecisionRef.current = null;
    dispatchBase("reset");
  }, []);

  return {
    state,
    dispatch,
    evaluateTurn,
    lastDecision: lastDecisionRef.current,
    reset,
  };
}
