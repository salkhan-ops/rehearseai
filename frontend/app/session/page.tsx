import { Suspense } from "react";
import SessionPage from "./[id]/SessionClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SessionPage />
    </Suspense>
  );
}
