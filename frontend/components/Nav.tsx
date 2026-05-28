import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 glass">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-black tracking-tight">RehearseAI</Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-black/65 sm:flex">
          <Link href="/practice">Practice</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
        <Link href="/signin" className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-black">Sign in</Link>
      </nav>
    </header>
  );
}
