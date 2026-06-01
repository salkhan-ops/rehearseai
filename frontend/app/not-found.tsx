"use client";

import Link from "next/link";
import { useEffect } from "react";

const dynamicRoutes = new Set(["course", "report", "session"]);

export default function NotFound() {
  useEffect(() => {
    const path = window.location.pathname;
    const segments = path.split("/").filter(Boolean);
    const basePath = segments[0] === "rehearseai" ? "/rehearseai" : "";
    const routeIndex = basePath ? 1 : 0;
    const route = segments[routeIndex];
    const id = segments[routeIndex + 1];

    if (!route || !id || !dynamicRoutes.has(route)) return;

    const search = new URLSearchParams(window.location.search);
    search.set("id", id);
    window.location.replace(`${basePath}/${route}?${search.toString()}`);
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 text-slate-950">
      <div className="text-center">
        <div className="text-5xl font-semibold tracking-[-0.05em]">404</div>
        <p className="mt-3 font-medium text-slate-600">This page could not be found.</p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">
          Go home
        </Link>
      </div>
    </main>
  );
}
