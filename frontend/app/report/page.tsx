import { Suspense } from "react";
import ReportPage from "./[id]/ReportClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReportPage />
    </Suspense>
  );
}
