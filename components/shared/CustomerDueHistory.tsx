"use client";

import { useState, useEffect } from 'react';
import { DollarSign, Calendar, FileText, User, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertTriangle, Package, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Invoice, Payment, Customer } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CustomerDueHistoryProps {
  customerId: string;
  customer?: Customer;
  invoices?: Invoice[];
  payments?: Payment[];
  className?: string;
}

interface Transaction {
  id: string;
  type: 'invoice' | 'payment' | 'return';
  date: Date;
  amount: number;
  dueAmount?: number;
  status: string;
  reference: string;
  description: string;
  invoice?: Invoice;
  payment?: Payment;
}

export function CustomerDueHistory({
  customerId,
  customer,
  invoices = [],
  payments = [],
  className,
}: CustomerDueHistoryProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'transactions' | 'invoices'>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Use customer totals if available, otherwise calculate from invoices
  const totalSalesCents = customer?.totalSalesCents ?? invoices.reduce((sum, inv) => sum + inv.totalCents, 0);
  
  // Calculate total paid from actual payment records, not just invoice.paidCents
  const totalPaidCents = invoices.reduce((sum, inv) => {
    if (inv.payments && inv.payments.length > 0) {
      // Sum all individual payments
      return sum + inv.payments.reduce((paymentSum, p) => paymentSum + p.amountCents, 0);
    } else {
      // Fallback to invoice.paidCents if no payment records
      return sum + (inv.paidCents || 0);
    }
  }, 0);
  
  // Calculate total due - invoices that are pending or partial
  const totalDueCents = customer?.totalDueCents ?? invoices
    .filter(inv => inv.paymentStatus === 'pending' || inv.paymentStatus === 'partial')
    .reduce((sum, inv) => {
      // Calculate due from actual payments
      const paidFromPayments = inv.payments?.reduce((s, p) => s + p.amountCents, 0) || 0;
      const calculatedPaid = Math.max(inv.paidCents || 0, paidFromPayments);
      return sum + Math.max(0, inv.totalCents - calculatedPaid);
    }, 0);
  
  const totalInvoicedCents = totalSalesCents;
  const totalSalesCount = customer?.totalSalesCount ?? invoices.length;

  useEffect(() => {
    // Build transaction list
    const transactionList: Transaction[] = [];

    // Process invoices
    invoices.forEach((invoice) => {
      transactionList.push({
        id: invoice.id,
        type: 'invoice',
        date: invoice.invoiceDate,
        amount: invoice.totalCents,
        dueAmount: invoice.dueCents,
        status: invoice.paymentStatus,
        reference: invoice.invoiceNumber,
        description: `Invoice ${invoice.invoiceNumber} - ${invoice.type === 'sale' ? 'Sale' : 'Purchase'}`,
        invoice,
      });

      // Add payments from payments array if exists (individual payment records)
      if (invoice.payments && invoice.payments.length > 0) {
        invoice.payments.forEach((payment) => {
          transactionList.push({
            id: payment.id,
            type: 'payment',
            date: payment.paymentDate,
            amount: payment.amountCents,
            status: payment.status,
            reference: payment.reference || `Payment for ${invoice.invoiceNumber}`,
            description: `Payment via ${payment.paymentMethod}`,
            payment,
          });
        });
      } else if (invoice.paidCents > 0) {
        // Fallback: If no payment records exist but paidCents > 0, show aggregate payment
        // This handles legacy data or cases where payment wasn't recorded properly
        transactionList.push({
          id: `${invoice.id}-payment-aggregate`,
          type: 'payment',
          date: invoice.invoiceDate, // Use invoice date as payment date
          amount: invoice.paidCents,
          status: invoice.paymentStatus,
          reference: `Payment for ${invoice.invoiceNumber}`,
          description: `Payment via ${invoice.paymentMethod || 'N/A'}`,
          invoice,
        });
      }
    });

    // Sort transactions by date (newest first)
    transactionList.sort((a, b) => b.date.getTime() - a.date.getTime());

    setTransactions(transactionList);
  }, [invoices, payments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100).replace(/BDT/g, '৳').trim();
  };

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  const formatDateTime = (date: Date) => {
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  const getStatusBadge = (status: string, type: 'invoice' | 'payment' | 'return') => {
    const variants: Record<string, any> = {
      paid: { variant: 'default' as const, icon: CheckCircle, text: 'Paid', className: 'bg-green-100 text-green-800' },
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      partial: { variant: 'outline' as const, icon: Clock, text: 'Partial', className: 'bg-orange-100 text-orange-800' },
      overdue: { variant: 'destructive' as const, icon: XCircle, text: 'Overdue', className: 'bg-red-100 text-red-800' },
      cancelled: { variant: 'outline' as const, icon: XCircle, text: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
    };

    const config = variants[status] || { variant: 'outline' as const, icon: Clock, text: status, className: '' };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={cn("flex items-center gap-1", config.className)}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getTransactionIcon = (type: 'invoice' | 'payment' | 'return') => {
    switch (type) {
      case 'invoice':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'return':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
  };

  const isOverdue = customer?.nextDueDate && customer.nextDueDate < new Date();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Customer Info */}
      <div className="flex items-start justify-between border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{customer?.name || 'Customer'}</h2>
              <div className="flex items-center gap-3 mt-1">
                {customer?.email && (
                  <span className="text-sm text-muted-foreground">{customer.email}</span>
                )}
                {customer?.phone && (
                  <span className="text-sm text-muted-foreground">{customer.phone}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        {customer?.nextDueDate && (
          <div className={cn(
            "text-right p-3 rounded-lg border-2",
            isOverdue ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
          )}>
            <div className="text-xs text-muted-foreground mb-1">Next Due Date</div>
            <div className={cn(
              "text-lg font-bold flex items-center gap-2",
              isOverdue ? "text-red-600" : "text-blue-600"
            )}>
              {formatDate(customer.nextDueDate)}
              {isOverdue && <AlertTriangle className="h-5 w-5" />}
            </div>
            {isOverdue && (
              <div className="text-xs text-red-600 mt-1">Overdue</div>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Total Sales</p>
              <p className="text-3xl font-bold text-blue-900">{formatCurrency(totalSalesCents)}</p>
              <p className="text-xs text-blue-600 mt-1">{totalSalesCount} sale{totalSalesCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <TrendingUp className="h-8 w-8 text-blue-700" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">Total Paid</p>
              <p className="text-3xl font-bold text-green-900">{formatCurrency(totalPaidCents)}</p>
              <p className="text-xs text-green-600 mt-1">
                {totalSalesCents > 0 ? `${Math.round((totalPaidCents / totalSalesCents) * 100)}% paid` : 'No payments'}
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-700" />
            </div>
          </div>
        </Card>

        <Card className={cn(
          "p-5 border-2",
          totalDueCents > 0 
            ? "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300" 
            : "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                "text-sm font-medium mb-1",
                totalDueCents > 0 ? "text-orange-700" : "text-green-700"
              )}>
                Total Due
              </p>
              <p className={cn(
                "text-3xl font-bold",
                totalDueCents > 0 ? "text-orange-900" : "text-green-900"
              )}>
                {formatCurrency(totalDueCents)}
              </p>
              {totalDueCents > 0 && (
                <p className="text-xs text-orange-600 mt-1">Outstanding balance</p>
              )}
            </div>
            <div className={cn(
              "p-3 rounded-full",
              totalDueCents > 0 ? "bg-orange-200" : "bg-green-200"
            )}>
              {totalDueCents > 0 ? (
                <AlertTriangle className="h-8 w-8 text-orange-700" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-700" />
              )}
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">Total Invoiced</p>
              <p className="text-3xl font-bold text-purple-900">{formatCurrency(totalInvoicedCents)}</p>
              <p className="text-xs text-purple-600 mt-1">All invoices</p>
            </div>
            <div className="p-3 bg-purple-200 rounded-full">
              <FileText className="h-8 w-8 text-purple-700" />
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Sales ({invoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Customer Information */}
          {customer && (
            <Card className="p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Credit Limit:</span>
                  <p className="font-medium">{formatCurrency(customer.creditLimit * 100)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Payment Terms:</span>
                  <p className="font-medium">{customer.paymentTerms} days</p>
                </div>
                {customer.email && (
                  <div>
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <span className="text-sm text-muted-foreground">Phone:</span>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                )}
                {customer.totalSalesCount !== undefined && (
                  <div>
                    <span className="text-sm text-muted-foreground">Total Sales:</span>
                    <p className="font-medium">{customer.totalSalesCount} sale{customer.totalSalesCount !== 1 ? 's' : ''}</p>
                  </div>
                )}
                {customer.lastSaleDate && (
                  <div>
                    <span className="text-sm text-muted-foreground">Last Sale:</span>
                    <p className="font-medium">{formatDate(customer.lastSaleDate)}</p>
                  </div>
                )}
                {customer.nextDueDate && (
                  <div>
                    <span className="text-sm text-muted-foreground">Next Due:</span>
                    <p className={cn(
                      "font-medium",
                      customer.nextDueDate < new Date() && "text-red-600"
                    )}>
                      {formatDate(customer.nextDueDate)}
                      {customer.nextDueDate < new Date() && " (Overdue)"}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Recent Sales Overview */}
          <Card className="p-5">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Recent Sales Overview
            </h3>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {invoices.slice(0, 10).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        "p-2 rounded-lg",
                        invoice.paymentStatus === 'paid' ? "bg-green-100" : 
                        invoice.paymentStatus === 'partial' ? "bg-orange-100" : 
                        "bg-yellow-100"
                      )}>
                        {getTransactionIcon('invoice')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{invoice.invoiceNumber}</span>
                          {getStatusBadge(invoice.paymentStatus, 'invoice')}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(invoice.invoiceDate)}
                          </div>
                          {invoice.dueDate && (
                            <div className={cn(
                              "flex items-center gap-1",
                              invoice.dueDate < new Date() && invoice.dueCents > 0 && "text-red-600"
                            )}>
                              <Clock className="h-3 w-3" />
                              Due: {formatDate(invoice.dueDate)}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {invoice.lineItems?.length || 0} items
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatCurrency(invoice.totalCents)}</div>
                      {invoice.dueCents > 0 && (
                        <div className="text-sm text-orange-600 font-medium">
                          Due: {formatCurrency(invoice.dueCents)}
                        </div>
                      )}
                      {invoice.paidCents > 0 && (
                        <div className="text-sm text-green-600">
                          Paid: {formatCurrency(invoice.paidCents)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No sales found</p>
                    <p className="text-sm mt-1">This customer has no sales history yet.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4 mt-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        "p-3 rounded-lg",
                        transaction.type === 'payment' ? "bg-green-100" : "bg-blue-100"
                      )}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-lg">{transaction.description}</span>
                          {getStatusBadge(transaction.status, transaction.type)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(transaction.date)}
                          </div>
                          <div>Ref: {transaction.reference}</div>
                          {transaction.dueAmount !== undefined && transaction.dueAmount > 0 && (
                            <div className="text-orange-600 font-medium">
                              Due: {formatCurrency(transaction.dueAmount)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-2xl font-bold",
                        transaction.type === 'payment' ? "text-green-600" : "text-foreground"
                      )}>
                        {transaction.type === 'payment' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                      {transaction.invoice && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            console.log('View invoice:', transaction.invoice?.id);
                          }}
                        >
                          View Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              {transactions.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No transactions found</p>
                  <p className="text-sm mt-2">This customer has no transaction history yet.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4 mt-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-bold text-xl">{invoice.invoiceNumber}</span>
                        {getStatusBadge(invoice.paymentStatus, 'invoice')}
                        <Badge variant="outline">{invoice.type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-muted-foreground">Invoice Date:</span>
                          <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
                        </div>
                        {invoice.dueDate && (
                          <div>
                            <span className="text-sm text-muted-foreground">Due Date:</span>
                            <p className={cn(
                              "font-medium",
                              invoice.dueDate < new Date() && invoice.dueCents > 0 && "text-red-600"
                            )}>
                              {formatDate(invoice.dueDate)}
                              {invoice.dueDate < new Date() && invoice.dueCents > 0 && " (Overdue)"}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-sm text-muted-foreground">Total Amount:</span>
                          <p className="font-semibold text-lg">{formatCurrency(invoice.totalCents)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Due Amount:</span>
                          <p className={cn(
                            "font-semibold text-lg",
                            invoice.dueCents > 0 ? "text-orange-600" : "text-green-600"
                          )}>
                            {formatCurrency(invoice.dueCents)}
                          </p>
                        </div>
                      </div>
                      {invoice.lineItems && invoice.lineItems.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground mb-2">Items ({invoice.lineItems.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {invoice.lineItems.slice(0, 5).map((item: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {item.quantity} x {item.unit || 'pcs'}
                              </Badge>
                            ))}
                            {invoice.lineItems.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{invoice.lineItems.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('View invoice:', invoice.id);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {invoices.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No invoices found</p>
                  <p className="text-sm mt-2">This customer has no invoices yet.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
