"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export function AnimatedPage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease } }
      }}
      whileHover={reduce ? undefined : { scale: 1.03, y: -4, boxShadow: "0 20px 55px rgba(98, 0, 168, 0.10)" }}
      transition={{ duration: 0.25, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : 0.08 } }
      }}
      initial={reduce ? false : "hidden"}
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedMessage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function TypingIndicator() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={reduce ? undefined : { opacity: [0.55, 1, 0.55] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      className="w-fit rounded-full bg-violet-100 px-4 py-3 text-sm font-semibold text-violet-700 dark:bg-violet-400/20 dark:text-violet-100"
    >
      Thinking...
    </motion.div>
  );
}

export function AnimatedNumber({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const totalFrames = 28;
    const start = performance.now();
    const tick = () => {
      frame = Math.min(totalFrames, Math.round(((performance.now() - start) / 700) * totalFrames));
      setDisplay(Math.round((value * frame) / totalFrames));
      if (frame < totalFrames) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, reduce]);

  return <>{display}</>;
}
