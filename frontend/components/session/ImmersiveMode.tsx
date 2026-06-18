"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minimize2 } from "lucide-react";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { AICharacterEnvironment } from "@/components/AICharacterEnvironment";
import type { EnvironmentMode } from "@/lib/types";

type OrbMode = "idle" | "listening" | "thinking" | "speaking" | "pressure" | "error";

const STATE_MESSAGES: Record<OrbMode, string[]> = {
  idle:      ["Ready when you are"],
  listening: ["I'm listening...", "Go ahead...", "Take your time..."],
  thinking:  ["Processing your answer...", "Thinking...", "One moment..."],
  speaking:  ["Responding...", "Speaking..."],
  pressure:  ["Pressure is on — hold your ground"],
  error:     ["Connection issue — still here"],
};

// Pick message deterministically per orbMode so it doesn't flicker
function getMessage(mode: OrbMode): string {
  const options = STATE_MESSAGES[mode];
  return options[0];
}

// Rich visual descriptors shown below the main label
const STATE_HINT: Record<OrbMode, string> = {
  idle:      "Start speaking whenever you are ready",
  listening: "Mic is active — your voice is being captured",
  thinking:  "Your answer was received — waiting for AI response",
  speaking:  "AI is generating its response",
  pressure:  "High-pressure mode active",
  error:     "Attempting to reconnect",
};

type Props = {
  open: boolean;
  onClose: () => void;
  orbMode: OrbMode;
  visualMode: EnvironmentMode;
  activeSpeaker?: string | null;
  intensity?: number;
  naturalStateLabel?: string;
  conversationStarted: boolean;
  onStart: () => void;
};

export function ImmersiveMode({
  open,
  onClose,
  orbMode,
  visualMode,
  activeSpeaker,
  intensity = 0.5,
  naturalStateLabel,
  conversationStarted,
  onStart,
}: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const label = naturalStateLabel || getMessage(orbMode);
  const hint = STATE_HINT[orbMode];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="immersive"
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden bg-[#04090f]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          {/* Subtle radial background that shifts with orb state */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={{
              background:
                orbMode === "thinking"
                  ? "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(139,92,246,0.12) 0%, transparent 70%)"
                  : orbMode === "speaking"
                  ? "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59,130,246,0.10) 0%, transparent 70%)"
                  : orbMode === "listening"
                  ? "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(34,211,238,0.09) 0%, transparent 70%)"
                  : "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(30,41,59,0.4) 0%, transparent 70%)",
            }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />

          {/* Close button — top right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white/50 ring-1 ring-white/12 backdrop-blur-xl transition hover:bg-white/[0.14] hover:text-white/80"
            title="Exit focus mode (Esc)"
          >
            <Minimize2 size={15} />
          </button>

          {/* Visual — fills everything above the bottom labels */}
          {visualMode === "AI Orb" ? (
            <div className="absolute inset-x-0 top-0 bottom-40 flex items-center justify-center">
              <div className="scale-[1.45] transform sm:scale-[1.6]">
                <AIPresenceOrb state={orbMode} intensity={intensity} />
              </div>
            </div>
          ) : (
            /*
             * Use flex justify-center on the outer div to reliably center the inner
             * max-w-6xl container. mx-auto on absolute+inset-x-0 elements is not
             * consistent across browsers, but flex centering always works.
             * AICharacterEnvironment's inset-x-0 then fills the 1152px flex child
             * exactly, so left:50% on each figure IS the screen center.
             */
            <div className="absolute inset-0 bottom-40 flex items-start justify-center overflow-hidden pt-6">
              <AICharacterEnvironment
                mode={visualMode}
                activeSpeaker={activeSpeaker ?? null}
                containerClassName="relative h-[34rem] w-full max-w-6xl overflow-hidden rounded-[2rem] [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_82%,transparent)]"
              />
            </div>
          )}

          {/* Bottom area — start button or live state labels */}
          <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center gap-3 px-4 text-center">
            {!conversationStarted ? (
              /* Conversation not started — show a prominent tap-to-start button */
              <motion.button
                type="button"
                onClick={onStart}
                className="rounded-full bg-cyan-400/15 px-8 py-4 text-lg font-semibold text-cyan-200 ring-1 ring-cyan-400/30 backdrop-blur-xl transition hover:bg-cyan-400/25 hover:ring-cyan-400/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                whileTap={{ scale: 0.96 }}
              >
                Start conversation
              </motion.button>
            ) : (
              <>
                {/* Primary animated state label */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={label}
                    className="text-2xl font-semibold tracking-[-0.02em] text-white/90"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.4 }}
                  >
                    {label}
                  </motion.p>
                </AnimatePresence>

                {/* Secondary hint */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={hint}
                    className="max-w-xs text-sm text-white/35"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    {hint}
                  </motion.p>
                </AnimatePresence>

                {/* Thinking dots — only while waiting for AI response */}
                {orbMode === "thinking" && (
                  <motion.div
                    className="flex gap-1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-violet-400/70"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                      />
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
