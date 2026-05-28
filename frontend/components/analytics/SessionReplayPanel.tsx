"use client";

export function SessionReplayPanel({
  replayItems,
  criticalMoments,
}: {
  replayItems: Array<Record<string, string | number>>;
  criticalMoments: Array<Record<string, string | number>>;
}) {
  return (
    <div className="rounded-[1.5rem] bg-white p-6 shadow-[0_14px_40px_rgba(35,45,75,0.04)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">Smart session replay</h2>
        <p className="mt-2 font-medium text-slate-600 dark:text-white/60">Pause points, pressure shifts, reasoning turns, and stronger alternative answers.</p>
      </div>
      <div className="mt-6 grid gap-4">
        {criticalMoments.map((moment) => (
          <div key={`${moment.turn}-${moment.type}`} className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100 dark:bg-rose-400/10 dark:ring-rose-300/15">
            <div className="text-sm font-semibold text-rose-700 dark:text-rose-100">Critical moment • Turn {moment.turn} • {moment.type}</div>
            <p className="mt-2 font-medium text-slate-700 dark:text-white/70">{moment.signal}</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{moment.coaching}</p>
          </div>
        ))}
        {replayItems.map((item) => (
          <div key={`${item.turn}-${item.response}`} className="rounded-2xl bg-slate-50 p-5 dark:bg-white/10">
            <div className="text-sm font-semibold text-violet-700 dark:text-violet-100">Turn {item.turn} • {item.pressureState}</div>
            <p className="mt-2 font-medium leading-7 text-slate-700 dark:text-white/70">{item.response}</p>
            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{item.analysis}</p>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-white/50">{item.decisionTurningPoint}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                ["Concise", item.betterConcise],
                ["Persuasive", item.morePersuasive],
                ["Executive", item.executiveStyle],
                ["Technical", item.technicalVersion],
                ["Emotionally intelligent", item.emotionallyIntelligent],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl bg-white p-4 text-sm font-medium leading-6 text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/60 dark:ring-white/10">
                  <span className="block font-semibold text-slate-900 dark:text-white">{label}</span>
                  {value}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
