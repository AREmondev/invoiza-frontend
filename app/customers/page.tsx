"use client";

import { useState } from 'react';
import { CustomerList } from '@/components/customers/customer-list';
import { CustomerListWithAdvancedTable } from '@/components/customers/customer-list-advanced';

export default function CustomersPage() {
  // For demo purposes, using a mock user ID. In a real app, this would come from authentication
  const [userId] = useState("user-123");
  const [useAdvancedTable, setUseAdvancedTable] = useState(true);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers & Partners</h1>
          <p className="text-muted-foreground">
            Manage your business relationships and track interactions
          </p>
        </div>
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
        <CustomerListWithAdvancedTable userId={userId} />
      ) : (
        <CustomerList />
      )}
    </div>
  );
}