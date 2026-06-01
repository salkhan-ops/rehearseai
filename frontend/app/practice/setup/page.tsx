import { Suspense } from "react";
import PracticeSetupPage from "./PracticeSetupClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PracticeSetupPage />
    </Suspense>
  );
}
