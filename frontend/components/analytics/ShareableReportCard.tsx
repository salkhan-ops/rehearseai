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
    <div ref={cardRef} className="rounded-[1.5rem] surface-low p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-primary-token">Shareable performance card</h2>
          <p className="mt-2 font-medium text-secondary-token">A mobile-friendly snapshot for private sharing or social proof.</p>
        </div>
        <button onClick={exportPng} className="rounded-full bg-[#6200a8] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.18)] transition hover:-translate-y-0.5">
          Export PNG
        </button>
      </div>
      <div className="mt-5 rounded-2xl surface-medium p-5">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary)]">RehearseAI</div>
        <div className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-primary-token">{highlights.title}</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Object.entries(highlights).filter(([key]) => key !== "title").map(([key, value]) => (
            <div key={key} className="rounded-xl surface-low p-4">
              <div className="text-3xl font-semibold tracking-[-0.04em] text-[var(--accent-primary)]">{value}</div>
              <div className="mt-1 text-sm font-semibold capitalize text-secondary-token">{key.replace(/([A-Z])/g, " $1")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
