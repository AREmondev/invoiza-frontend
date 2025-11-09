"use client";

import { TabManager } from "@/components/sales/TabManager";

export default function SalesPage() {
  return (
    <div className="relative">
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 select-none">
        <div className="text-[8rem] font-bold tracking-widest">DRAFT</div>
      </div>
      <div className="relative z-10">
        <h1 className="text-2xl font-semibold mb-4">Sales</h1>
        <TabManager />
      </div>
    </div>
  );
}
