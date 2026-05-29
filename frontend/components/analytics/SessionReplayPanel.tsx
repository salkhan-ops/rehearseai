"use client";

export function SessionReplayPanel({
  replayItems,
  criticalMoments,
}: {
  replayItems: Array<Record<string, string | number>>;
  criticalMoments: Array<Record<string, string | number>>;
}) {
  return (
    <div className="rounded-[1.5rem] surface-low p-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.035em] text-primary-token">Smart session replay</h2>
        <p className="mt-2 font-medium text-secondary-token">Pause points, pressure shifts, reasoning turns, and stronger alternative answers.</p>
      </div>
      <div className="mt-6 grid gap-4">
        {criticalMoments.map((moment) => (
          <div key={`${moment.turn}-${moment.type}`} className="rounded-2xl bg-rose-400/10 p-4 ring-1 ring-rose-300/20">
            <div className="text-sm font-semibold text-rose-300">Critical moment • Turn {moment.turn} • {moment.type}</div>
            <p className="mt-2 font-medium text-secondary-token">{moment.signal}</p>
            <p className="mt-2 text-sm font-semibold text-primary-token">{moment.coaching}</p>
          </div>
        ))}
        {replayItems.map((item) => (
          <div key={`${item.turn}-${item.response}`} className="rounded-2xl surface-medium p-5">
            <div className="text-sm font-semibold text-[var(--accent-primary)]">Turn {item.turn} • {item.pressureState}</div>
            <p className="mt-2 font-medium leading-7 text-secondary-token">{item.response}</p>
            <p className="mt-3 text-sm font-semibold text-primary-token">{item.analysis}</p>
            <p className="mt-2 text-sm font-medium text-tertiary-token">{item.decisionTurningPoint}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                ["Concise", item.betterConcise],
                ["Persuasive", item.morePersuasive],
                ["Executive", item.executiveStyle],
                ["Technical", item.technicalVersion],
                ["Emotionally intelligent", item.emotionallyIntelligent],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl surface-low p-4 text-sm font-medium leading-6 text-secondary-token">
                  <span className="block font-semibold text-primary-token">{label}</span>
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
