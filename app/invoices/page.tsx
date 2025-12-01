"use client";

import { useState } from 'react';
import { TabManager } from "@/components/invoices/TabManager";
import { InvoiceListAdvanced } from "@/components/invoices/invoice-list-advanced";

export default function InvoicesPage() {
  // For demo purposes, using a mock user ID. In a real app, this would come from authentication
  const [userId] = useState("user-123");
  const [useAdvancedTable, setUseAdvancedTable] = useState(true);

  return (
    <div className="p-6 h-[calc(100vh-65px)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useAdvancedTable"
              checked={useAdvancedTable}
              onChange={(e) => setUseAdvancedTable(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="useAdvancedTable" className="text-sm text-gray-600">
              Use Advanced TanStack Table
            </label>
          </div>
        </div>
      </div>
      {useAdvancedTable ? (
        <InvoiceListAdvanced userId={userId} />
      ) : (
        <TabManager />
      )}
    </div>
  );
}
