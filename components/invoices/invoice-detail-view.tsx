"use client";

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { useSession } from 'next-auth/react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DollarSign, 
  FileText, 
  Calendar,
  User,
  Building2,
  Package,
  Download,
  Mail,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { api } from '@/lib/convex';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface InvoiceDetailViewProps {
  invoice: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMakePayment?: () => void;
}

// Format currency helper function
const formatCurrency = (amountCents: number) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100).replace(/BDT/g, '৳').trim();
};

export function InvoiceDetailView({
  invoice,
  open,
  onOpenChange,
  onMakePayment,
}: InvoiceDetailViewProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  // Fetch commission agents for display
  const commissionAgents = useQuery(
    api.queries.commissionAgents.getCommissionAgents,
    userEmail ? { userEmail } : "skip"
  ) || [];

  // Fetch payments for this invoice
  const payments = useQuery(
    api.queries.payments.getPayments,
    userEmail && invoice?._id ? { userEmail, invoiceId: invoice._id } : "skip"
  ) || [];

  if (!invoice) return null;

  const dueAmountCents = invoice.calculatedDueCents || invoice.dueCents || 0;
  const paidAmountCents = invoice.totalCents - dueAmountCents;
  const paidPercentage = invoice.totalCents > 0 ? (paidAmountCents / invoice.totalCents) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Paid</Badge>;
      case 'partial':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Partial</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Pending</Badge>;
      case 'overpaid':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Overpaid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'sale':
        return <Badge variant="outline" className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">Sale</Badge>;
      case 'purchase':
        return <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">Purchase</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDaysUntilDue = (dueDate: Date | undefined) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = invoice.dueDate ? getDaysUntilDue(new Date(invoice.dueDate)) : null;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <FileText className="h-6 w-6 text-primary" />
                Invoice {invoice.invoiceNumber}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {invoice.type === 'sale' ? 'Sale' : 'Purchase'} Invoice Details
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getTypeBadge(invoice.type)}
              {getStatusBadge(invoice.paymentStatus || 'pending')}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(invoice.totalCents)}</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Paid Amount</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(paidAmountCents)}
                  </p>
                  <p className="text-xs text-muted-foreground">{paidPercentage.toFixed(1)}% paid</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Due Amount</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    dueAmountCents > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  )}>
                    {formatCurrency(dueAmountCents)}
                  </p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Payments</p>
                  <p className="text-2xl font-bold">{payments.length}</p>
                  <p className="text-xs text-muted-foreground">transactions</p>
                </div>
              </Card>
            </div>

            {/* Invoice Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Invoice Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Number:</span>
                    <span className="font-medium font-mono">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Date:</span>
                    <span className="font-medium">
                      {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                        </span>
                        {isOverdue && daysUntilDue !== null && (
                          <Badge variant="destructive" className="text-xs">
                            {Math.abs(daysUntilDue)} days overdue
                          </Badge>
                        )}
                        {daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7 && (
                          <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            {daysUntilDue} days left
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {invoice.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method:</span>
                      <span className="font-medium">{invoice.paymentMethod}</span>
                    </div>
                  )}
                  {invoice.terms && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Terms:</span>
                      <span className="font-medium">{invoice.terms}</span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  {invoice.type === 'sale' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                  {invoice.type === 'sale' ? 'Customer' : 'Supplier'} Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{invoice.billingName || invoice.customerName || 'N/A'}</span>
                  </div>
                  {invoice.customerId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-medium font-mono">{invoice.customerId}</span>
                    </div>
                  )}
                  {invoice.billingAddress && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-medium text-right max-w-[200px]">
                        {typeof invoice.billingAddress === 'string' 
                          ? invoice.billingAddress 
                          : `${invoice.billingAddress.street || ''}, ${invoice.billingAddress.city || ''}`}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Line Items */}
            {invoice.lineItems && invoice.lineItems.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Line Items
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.lineItems.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName || 'N/A'}</TableCell>
                          <TableCell>{item.quantity || 0}</TableCell>
                          <TableCell>{item.unit || 'N/A'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPriceCents || 0)}</TableCell>
                          <TableCell className="text-right">{formatCurrency((item.quantity || 0) * (item.unitPriceCents || 0))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {/* Amount Breakdown */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount Breakdown
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotalCents || 0)}</span>
                </div>
                {invoice.discountCents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -{formatCurrency(invoice.discountCents)}
                    </span>
                  </div>
                )}
                {invoice.taxCents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-medium">{formatCurrency(invoice.taxCents)}</span>
                  </div>
                )}
                {invoice.additionalChargesCents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Additional Charges:</span>
                    <span className="font-medium">{formatCurrency(invoice.additionalChargesCents)}</span>
                  </div>
                )}
                {invoice.commissionAmountCents > 0 && (
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span>Commission:</span>
                    <span className="font-medium">{formatCurrency(invoice.commissionAmountCents)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.totalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(paidAmountCents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className={cn(
                    "font-medium",
                    dueAmountCents > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  )}>
                    {formatCurrency(dueAmountCents)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Commission Agent */}
            {invoice.commissionAgentId && (
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Commission Agent
                </h3>
                <div className="text-sm space-y-2">
                  {(() => {
                    const agent = commissionAgents.find((a: any) => a._id === invoice.commissionAgentId);
                    return agent ? (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{agent.name}</span>
                        </div>
                        {agent.mobile && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mobile:</span>
                            <span className="font-medium">{agent.mobile}</span>
                          </div>
                        )}
                        {agent.email && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{agent.email}</span>
                          </div>
                        )}
                        {invoice.commissionAmountCents > 0 && (
                          <div className="flex justify-between text-blue-600 dark:text-blue-400">
                            <span>Commission Amount:</span>
                            <span className="font-medium">{formatCurrency(invoice.commissionAmountCents)}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Agent ID: {invoice.commissionAgentId}</div>
                    );
                  })()}
                </div>
              </Card>
            )}

            {/* Payment History */}
            {payments.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Payment History
                </h3>
                <div className="space-y-3">
                  {payments.map((payment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{formatCurrency(payment.amountCents)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(payment.paymentDate), 'MMM dd, yyyy HH:mm')}
                          {payment.paymentMethod && ` • ${payment.paymentMethod}`}
                          {payment.reference && ` • Ref: ${payment.reference}`}
                        </div>
                        {payment.notes && (
                          <div className="text-xs text-muted-foreground italic">{payment.notes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Notes */}
            {invoice.notes && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </Card>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {dueAmountCents > 0 && invoice.type === 'sale' && onMakePayment && (
            <Button onClick={onMakePayment} className="gap-2">
              <DollarSign className="h-4 w-4" />
              Make Payment
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

