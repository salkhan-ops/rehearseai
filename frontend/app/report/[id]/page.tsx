import { Suspense } from "react";
import ReportPage from "./ReportClient";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: "static-placeholder" }];
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReportPage />
    </Suspense>
  );
}
