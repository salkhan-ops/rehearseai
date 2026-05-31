import type { CourseTemplateAdmin, Plan, PracticeTemplate, Product } from "./admin";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function catalogRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getPublicProducts() {
  const products = await catalogRequest<Product[]>("/api/catalog/products");
  return products.filter((item) => item.isPublic && item.isActive !== false).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPublicPlans() {
  const plans = await catalogRequest<Plan[]>("/api/catalog/plans");
  return plans.filter((item) => item.isPublic !== false && item.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPublicPracticeTemplates() {
  const templates = await catalogRequest<PracticeTemplate[]>("/api/catalog/practice-templates");
  return templates.filter((item) => item.isPublic && item.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPublicCourseTemplates() {
  const templates = await catalogRequest<CourseTemplateAdmin[]>("/api/catalog/course-templates");
  return templates.filter((item) => item.isPublic && item.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}
