import { Suspense } from "react";
import CourseDetailPage from "./[id]/CourseDetailClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CourseDetailPage />
    </Suspense>
  );
}
