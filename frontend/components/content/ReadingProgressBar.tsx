"use client";

import { useEffect, useState } from "react";

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return <div className="fixed inset-x-0 top-0 z-50 h-1 bg-gradient-to-r from-cyan-300 via-violet-400 to-blue-400" style={{ transform: `scaleX(${progress / 100})`, transformOrigin: "0 50%" }} />;
}
