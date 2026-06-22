"use client";

import { useEffect, useState } from "react";
import { Camera, Sun, Layers, Zap } from "lucide-react";

const TIPS = [
  {
    icon: Camera,
    title: "Sit directly in frame",
    body: "Centre your face in the camera view, about arm's length away. Make sure your full head is visible.",
  },
  {
    icon: Sun,
    title: "Light your face from the front",
    body: "Sit facing a window or lamp. Avoid bright screens or windows directly behind you.",
  },
  {
    icon: Layers,
    title: "Keep the background simple",
    body: "Clutter or movement behind you can confuse face tracking. A plain wall or tidy space works best.",
  },
  {
    icon: Zap,
    title: "More precise turn-taking",
    body: "The AI reads when you naturally pause and responds at the right moment — no need to tap send.",
  },
];

export function CameraSetupGuide({ trigger }: { trigger: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    try {
      if (!localStorage.getItem("rh_seen_cam_setup")) {
        setOpen(true);
      }
    } catch { /* ignore */ }
  }, [trigger]);

  function handleDone() {
    try { localStorage.setItem("rh_seen_cam_setup", "1"); } catch { /* ignore */ }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDone} />
      <div className="relative w-full max-w-lg rounded-[2rem] bg-[#0d0020] p-7 ring-1 ring-white/12 shadow-[0_40px_120px_rgba(0,0,0,0.7)]">

        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600/25 ring-1 ring-violet-400/20">
          <Camera size={20} className="text-violet-300" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Camera timing enabled</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
          Set yourself up for best results
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Camera-assisted timing reads your natural pace. A clear, well-lit setup makes it significantly more precise.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {TIPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/8">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600/25">
                <Icon size={16} className="text-violet-300" />
              </div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="mt-1.5 text-xs leading-5 text-white/56">{body}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleDone}
          className="mt-5 w-full rounded-2xl bg-violet-600 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(98,0,168,0.4)] transition hover:bg-violet-500"
        >
          Done — I&apos;m ready
        </button>
      </div>
    </div>
  );
}
