"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CustomerDueHistory } from './CustomerDueHistory';
import { Customer } from '@/types';
import { mockCustomers } from '@/lib/mock-data';

interface CustomerDetailsModalProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailsModal({ customerId, open, onOpenChange }: CustomerDetailsModalProps) {
  const customer = customerId ? mockCustomers.find(c => c.id === customerId) : null;

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details - {customer.name}</DialogTitle>
        </DialogHeader>
        <CustomerDueHistory
          customerId={customerId!}
          customer={customer}
          invoices={[]}
          payments={[]}
        />
      </DialogContent>
    </Dialog>
  );
}

