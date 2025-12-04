"use client";

import { useState } from "react";
import { UnitsListWithAdvancedTable } from "@/components/units/units-list-advanced";

export default function UnitsPage() {
  const [userId] = useState("user-123");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Units & Conversions</h1>
          <p className="text-muted-foreground">
            Manage units and unit conversions for pharmacy products
          </p>
        </div>
      </div>
      <UnitsListWithAdvancedTable userId={userId} />
    </div>
  );
}
 