"use client";

import { AnimatedPage } from "@/components/animations";
import { Footer } from "@/components/content/Footer";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { Nav } from "@/components/Nav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SubscriptionManager } from "@/components/subscription/SubscriptionManager";

export default function SubscriptionPage() {
  return (
    <main className="cog-bg min-h-screen text-primary-token">
      <Nav />
      <ProtectedRoute>
        <AnimatedPage className="mx-auto max-w-5xl px-4 py-14">
          <SubscriptionManager />
          <div className="mt-6">
            <AIDisclaimer />
          </div>
        </AnimatedPage>
      </ProtectedRoute>
      <Footer />
    </main>
  );
}
