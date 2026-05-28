"use client";

import { AnimatedPage } from "@/components/animations";
import { AuthForm } from "@/components/auth/AuthForm";
import { Nav } from "@/components/Nav";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#f4f8fc] dark:bg-[#0e1020]">
      <Nav />
      <AnimatedPage className="mx-auto max-w-md px-4 py-16">
        <AuthForm mode="signup" />
      </AnimatedPage>
    </main>
  );
}
