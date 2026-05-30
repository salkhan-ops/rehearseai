import Link from "next/link";
import { BrainCircuit } from "lucide-react";

const links = [
  ["Blog", "/blog"],
  ["Articles", "/articles"],
  ["Resources", "/resources"],
  ["Contact", "/contact"],
  ["Terms", "/terms"],
  ["Privacy", "/privacy"],
  ["Refund Policy", "/refund-policy"],
  ["Cookies", "/cookies"],
  ["Subscription", "/subscription"],
  ["Pricing", "/pricing"],
];

export function Footer() {
  return (
    <footer className="relative z-10 px-4 py-12">
      <div className="mx-auto max-w-6xl rounded-[2rem] surface-low p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold tracking-[0.18em] text-primary-token"><BrainCircuit size={22} /> REHEARSEAI</div>
            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-secondary-token">A voice-first cognitive performance environment for high-stakes communication.</p>
            <p className="mt-3 text-xs font-semibold text-tertiary-token">© 2026 RehearseAI. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-secondary-token">
            {links.map(([label, href]) => <Link key={href} href={href} className="transition hover:text-[var(--accent-primary)]">{label}</Link>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
