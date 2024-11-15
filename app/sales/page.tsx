"use client";

import { TabManager } from "@/components/sales/TabManager";

export default function SalesPage() {
  return (
    <div className="p-6 h-[calc(100vh-65px)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sales</h1>
      </div>
      <TabManager />
    </div>
  );
}
