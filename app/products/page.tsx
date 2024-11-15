"use client";

import { ProductList } from "@/components/products/ProductList";
import { AddProductModal } from "@/components/products/add-product-modal";

export default function ProductsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <AddProductModal />
      </div>
      <ProductList />
    </div>
  );
}
