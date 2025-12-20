"use client";

import { useSession } from 'next-auth/react';
import { InvoiceListAdvanced } from "@/components/invoices/invoice-list-advanced";

export default function InvoicesPage() {
  const { data: session } = useSession();
  const userId = session?.user?.email || "default-user";

  return (
    <div className="p-6 h-[calc(100vh-65px)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
      </div>
      <InvoiceListAdvanced userId={userId} />
    </div>
  );
}
