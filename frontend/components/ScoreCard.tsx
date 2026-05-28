export function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
      <div className="text-sm font-semibold text-black/55">{label}</div>
      <div className="mt-3 flex items-end gap-3">
        <span className="text-4xl font-black">{score}</span>
        <span className="pb-1 text-sm text-black/45">/100</span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-black/10">
        <div className="h-2 rounded-full bg-iris" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
