"use client";

import { PaymentMethodList } from "@/components/payment-methods/payment-method-list";

export default function PaymentMethodsPage() {
  return (
    <div className="p-6 h-[calc(100vh-65px)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Payment Methods</h1>
        <p className="text-muted-foreground">
          Manage payment methods for your organization
        </p>
      </div>
      <PaymentMethodList />
    </div>
  );
}

