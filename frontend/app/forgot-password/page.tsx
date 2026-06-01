"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?auth=forgot");
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 text-center text-sm font-semibold text-slate-600 dark:bg-[#07111f] dark:text-white/60">
      Opening password reset...
    </main>
  );
}
