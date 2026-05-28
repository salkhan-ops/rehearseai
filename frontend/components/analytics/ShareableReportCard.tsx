"use client";

import { useRef } from "react";

export function ShareableReportCard({ highlights }: { highlights: Record<string, string | number> }) {
  const cardRef = useRef<HTMLDivElement>(null);

  function exportPng() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, "#f4f8fc");
    gradient.addColorStop(1, "#ece5ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = "#242936";
    ctx.font = "700 62px Arial";
    ctx.fillText("RehearseAI", 70, 110);
    ctx.font = "700 44px Arial";
    ctx.fillText(String(highlights.title || "Cognitive Performance Report"), 70, 180);
    const rows = [
      ["Confidence", highlights.confidenceScore],
      ["Pressure Handling", highlights.pressureHandling],
      ["Communication Intelligence", highlights.communicationIntelligence],
      ["Reasoning Strength", highlights.reasoningStrength],
      ["Emotional Composure", highlights.emotionalComposure],
      ["Persuasiveness", highlights.persuasiveness],
    ];
    rows.forEach(([label, score], index) => {
      const x = 70 + (index % 2) * 520;
      const y = 280 + Math.floor(index / 2) * 105;
      ctx.fillStyle = "#ffffff";
      ctx.roundRect(x, y - 55, 455, 78, 24);
      ctx.fill();
      ctx.fillStyle = "#6200a8";
      ctx.font = "700 38px Arial";
      ctx.fillText(String(score), x + 26, y);
      ctx.fillStyle = "#475569";
      ctx.font = "600 24px Arial";
      ctx.fillText(String(label), x + 110, y);
    });
    const link = document.createElement("a");
    link.download = "rehearseai-performance-report.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div ref={cardRef} className="rounded-[1.5rem] bg-white p-6 shadow-[0_14px_40px_rgba(35,45,75,0.04)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">Shareable performance card</h2>
          <p className="mt-2 font-medium text-slate-600 dark:text-white/60">A mobile-friendly snapshot for private sharing or social proof.</p>
        </div>
        <button onClick={exportPng} className="rounded-full bg-[#6200a8] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.18)] transition hover:-translate-y-0.5">
          Export PNG
        </button>
      </div>
      <div className="mt-5 rounded-2xl bg-gradient-to-br from-violet-50 to-sky-50 p-5 dark:from-white/10 dark:to-white/5">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-100">RehearseAI</div>
        <div className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">{highlights.title}</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Object.entries(highlights).filter(([key]) => key !== "title").map(([key, value]) => (
            <div key={key} className="rounded-xl bg-white/80 p-4 ring-1 ring-white/70 dark:bg-white/10 dark:ring-white/10">
              <div className="text-3xl font-semibold tracking-[-0.04em] text-[#6200a8] dark:text-violet-100">{value}</div>
              <div className="mt-1 text-sm font-semibold capitalize text-slate-600 dark:text-white/60">{key.replace(/([A-Z])/g, " $1")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
