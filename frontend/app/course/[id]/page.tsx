import { Suspense } from "react";
import CourseDetailPage from "./CourseDetailClient";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: "static-placeholder" }];
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CourseDetailPage />
    </Suspense>
  );
}
