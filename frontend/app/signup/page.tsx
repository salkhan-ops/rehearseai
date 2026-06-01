"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?auth=signup");
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 text-center text-sm font-semibold text-slate-600 dark:bg-[#07111f] dark:text-white/60">
      Opening create account...
    </main>
  );
}
