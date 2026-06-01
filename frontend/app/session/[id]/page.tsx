import { Suspense } from "react";
import SessionPage from "./SessionClient";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: "static-placeholder" }];
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SessionPage />
    </Suspense>
  );
}
