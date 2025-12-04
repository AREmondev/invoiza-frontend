"use client";

import { useState } from "react";
import { CategoriesListWithAdvancedTable } from "@/components/categories/categories-list-advanced";

export default function CategoriesPage() {
  const [userId] = useState("user-123");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage medicine and product categories
          </p>
        </div>
      </div>
      <CategoriesListWithAdvancedTable userId={userId} />
    </div>
  );
}
 