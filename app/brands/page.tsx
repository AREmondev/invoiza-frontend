"use client";

import { useState } from "react";
import { BrandsListWithAdvancedTable } from "@/components/brands/brands-list-advanced";


export default function BrandsPage() {
  const [userId] = useState("user-123");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">
            Manage medicine and product brands
          </p>
        </div>
      </div>
      <BrandsListWithAdvancedTable userId={userId} />
    </div>
  );
}

