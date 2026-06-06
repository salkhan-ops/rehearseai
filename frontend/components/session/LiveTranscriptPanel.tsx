"use client";

export function LiveTranscriptPanel({
  transcript,
  interimTranscript,
  label = "Live transcript",
}: {
  transcript?: string;
  interimTranscript?: string;
  label?: string;
}) {
  if (!transcript && !interimTranscript) return null;
  return (
    <div className="mb-3 rounded-[1.35rem] bg-cyan-100/[0.08] p-4 text-center text-sm font-medium leading-6 text-cyan-50/80 ring-1 ring-cyan-100/15 backdrop-blur-2xl">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/38">{label}</div>
      <span>{transcript}</span>
      {interimTranscript && <span className="text-cyan-100/38"> {interimTranscript}</span>}
    </div>
  );
}
