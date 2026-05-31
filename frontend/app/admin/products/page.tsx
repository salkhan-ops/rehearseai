"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { createProduct, listProducts, saveProduct, type Product } from "@/lib/admin";

const blankProduct: Product = {
  productId: "new-product",
  title: "New Product",
  slug: "new-product",
  description: "",
  category: "practice",
  linkedPlanId: "free",
  linkedTemplateId: "",
  priceDisplay: "$0",
  badgeText: "",
  isFeatured: false,
  isPublic: false,
  isActive: true,
  sortOrder: 99,
  heroText: "",
  benefits: [],
  limitations: [],
  ctaText: "Learn more",
  ctaUrl: "/pricing",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const refresh = () => listProducts().then(setProducts);
  useEffect(() => { refresh(); }, []);
  return (
    <AdminLayout>
      <AdminHeader title="Products & Packages" subtitle="Public-facing package cards for pricing, course, and practice pages." action={<button onClick={async () => { await createProduct(blankProduct); refresh(); }} className="rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Create product</button>} />
      <div className="grid gap-4">
        {products.map((product) => <ProductEditor key={product.productId} product={product} onSave={async (next) => { await saveProduct(next); refresh(); }} />)}
      </div>
    </AdminLayout>
  );
}
