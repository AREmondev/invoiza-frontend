"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CustomerDueHistory } from './CustomerDueHistory';
import { CustomerPaymentModal } from '@/components/customers/customer-payment-modal';
import { useQuery } from 'convex/react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/convex';
import { User, DollarSign } from 'lucide-react';

interface CustomerDetailsModalProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailsModal({ customerId, open, onOpenChange }: CustomerDetailsModalProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

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
  
  // Calculate total paid from actual payment records
  const calculatedTotalPaid = salesHistory.reduce((sum, inv: any) => {
    if (inv.payments && inv.payments.length > 0) {
      // Sum all individual payments
      return sum + inv.payments.reduce((paymentSum: number, p: any) => paymentSum + (p.amountCents || 0), 0);
    } else {
      // Fallback to invoice.paidCents if no payment records
      return sum + (inv.paidCents || 0);
    }
  }, 0);
  
  // Calculate total due from actual payments
  const calculatedTotalDue = salesHistory
    .filter((inv: any) => inv.paymentStatus === 'pending' || inv.paymentStatus === 'partial')
    .reduce((sum, inv: any) => {
      const paidFromPayments = (inv.payments || []).reduce((s: number, p: any) => s + (p.amountCents || 0), 0);
      const calculatedPaid = Math.max(inv.paidCents || 0, paidFromPayments);
      return sum + Math.max(0, (inv.totalCents || 0) - calculatedPaid);
    }, 0);

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

  // Convert invoices to Invoice type with payments
  const invoices = salesHistory.map((inv: any) => {
    // Calculate total paid from payments array
    const totalPaidFromPayments = (inv.payments || []).reduce(
      (sum: number, p: any) => sum + (p.amountCents || 0),
      0
    );
    
    // Use the higher of invoice.paidCents or totalPaidFromPayments
    const calculatedPaidCents = Math.max(inv.paidCents || 0, totalPaidFromPayments);
    const calculatedDueCents = Math.max(0, inv.totalCents - calculatedPaidCents);

    return {
      id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      type: inv.type,
      customerId: inv.customerId,
      invoiceDate: new Date(inv.invoiceDate),
      dueDate: inv.dueDate ? new Date(inv.dueDate) : undefined,
      totalCents: inv.totalCents,
      paidCents: calculatedPaidCents,
      dueCents: calculatedDueCents,
      paymentStatus: inv.paymentStatus,
      paymentMethod: inv.paymentMethod,
      status: inv.status,
      lineItems: inv.lineItems || [],
      payments: (inv.payments || []).map((p: any) => ({
        id: p._id,
        invoiceId: p.invoiceId,
        amountCents: p.amountCents,
        paymentMethod: p.paymentMethod,
        reference: p.reference,
        notes: p.notes,
        paymentDate: new Date(p.paymentDate),
        status: p.status,
        processedBy: p.processedBy,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        createdBy: p.createdBy,
        updatedBy: p.updatedBy,
      })),
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Customer Details - {customer.name}
            </DialogTitle>
            <Button
              onClick={() => setPaymentModalOpen(true)}
              className="flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Make Payment
            </Button>
          </div>
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

      {/* Payment Modal */}
      <CustomerPaymentModal
        customerId={customerId}
        customerName={customer?.name}
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onPaymentSuccess={() => {
          // Data will refresh automatically via useQuery
        }}
      />
    </Dialog>
  );
}

