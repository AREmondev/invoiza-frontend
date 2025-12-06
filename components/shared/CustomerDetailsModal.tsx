"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CustomerDueHistory } from './CustomerDueHistory';
import { useQuery } from 'convex/react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/convex';
import { User } from 'lucide-react';

interface CustomerDetailsModalProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailsModal({ customerId, open, onOpenChange }: CustomerDetailsModalProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  // Fetch customer data
  const customer = useQuery(
    api.queries.customers.getCustomer,
    customerId && userEmail
      ? { customerId: customerId as any, userEmail }
      : "skip"
  );

  // Fetch customer sales history
  const salesHistory = useQuery(
    api.queries.customers.getCustomerSalesHistory,
    customerId && userEmail
      ? { customerId: customerId as any, userEmail, limit: 100 }
      : "skip"
  ) || [];

  if (!customer || !customerId) return null;

  // Calculate totals from invoices if customer totals are not available
  const calculatedTotalSales = salesHistory.reduce((sum, inv: any) => sum + (inv.totalCents || 0), 0);
  const calculatedTotalDue = salesHistory
    .filter((inv: any) => inv.paymentStatus === 'pending' || inv.paymentStatus === 'partial')
    .reduce((sum, inv: any) => sum + (inv.dueCents || 0), 0);
  const calculatedTotalPaid = salesHistory.reduce((sum, inv: any) => sum + (inv.paidCents || 0), 0);

  // Use customer totals if available, otherwise calculate from invoices
  const totalSalesCents = customer.totalSalesCents ?? calculatedTotalSales;
  const totalDueCents = customer.totalDueCents ?? calculatedTotalDue;
  const totalSalesCount = customer.totalSalesCount ?? salesHistory.length;

  // Convert Convex customer to Customer type
  const customerData = {
    id: customer._id,
    name: customer.name,
    type: (customer.type || 'individual') as 'individual' | 'business',
    email: customer.email,
    phone: customer.phone || customer.mobile,
    creditLimit: customer.metadata?.creditLimit || 0,
    paymentTerms: customer.metadata?.paymentTerms || 30,
    receivableBalance: totalDueCents / 100,
    totalSalesCents,
    totalSalesCount,
    totalDueCents,
    totalPaidCents: calculatedTotalPaid,
    lastSaleDate: customer.lastSaleDate ? new Date(customer.lastSaleDate) : (salesHistory.length > 0 ? new Date(salesHistory[0].invoiceDate) : undefined),
    nextDueDate: customer.nextDueDate ? new Date(customer.nextDueDate) : undefined,
  };

  // Convert invoices to Invoice type
  const invoices = salesHistory.map((inv: any) => ({
    id: inv._id,
    invoiceNumber: inv.invoiceNumber,
    type: inv.type,
    customerId: inv.customerId,
    invoiceDate: new Date(inv.invoiceDate),
    dueDate: inv.dueDate ? new Date(inv.dueDate) : undefined,
    totalCents: inv.totalCents,
    paidCents: inv.paidCents || 0,
    dueCents: inv.dueCents || 0,
    paymentStatus: inv.paymentStatus,
    paymentMethod: inv.paymentMethod,
    status: inv.status,
    lineItems: inv.lineItems || [],
    payments: [],
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Customer Details - {customer.name}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(95vh - 100px)' }}>
          <CustomerDueHistory
            customerId={customerId}
            customer={customerData}
            invoices={invoices}
            payments={[]}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

