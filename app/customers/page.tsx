"use client";

import { useState } from 'react';
import { CustomerList } from '@/components/customers/customer-list';
import { CustomerListWithAdvancedTable } from '@/components/customers/customer-list-advanced';

export default function CustomersPage() {
  // For demo purposes, using a mock user ID. In a real app, this would come from authentication
  const [userId] = useState("user-123");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers & Partners</h1>
          <p className="text-muted-foreground">
            Manage your business relationships and track interactions
          </p>
        </div>
       
      </div>
      <CustomerListWithAdvancedTable userId={userId} />
    </div>
  );
}