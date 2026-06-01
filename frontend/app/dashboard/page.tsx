import { Suspense } from "react";
import DashboardPage from "./DashboardClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DashboardPage />
    </Suspense>
  );
}
