"use client";

import { useState, useEffect } from 'react';
import { DollarSign, Calendar, FileText, User, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';
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
  const [totalDue, setTotalDue] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalInvoiced, setTotalInvoiced] = useState(0);

  useEffect(() => {
    // Calculate totals and build transaction list
    let due = 0;
    let paid = 0;
    let invoiced = 0;
    const transactionList: Transaction[] = [];

    // Process invoices
    invoices.forEach((invoice) => {
      invoiced += invoice.totalCents;
      due += invoice.dueCents;
      paid += invoice.paidCents;

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

      // Add payments for this invoice
      invoice.payments?.forEach((payment) => {
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
    });

    // Sort transactions by date (newest first)
    transactionList.sort((a, b) => b.date.getTime() - a.date.getTime());

    setTransactions(transactionList);
    setTotalDue(due);
    setTotalPaid(paid);
    setTotalInvoiced(invoiced);
  }, [invoices, payments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  const getStatusBadge = (status: string, type: 'invoice' | 'payment' | 'return') => {
    const variants: Record<string, any> = {
      paid: { variant: 'default' as const, icon: CheckCircle, text: 'Paid' },
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Pending' },
      partial: { variant: 'outline' as const, icon: Clock, text: 'Partial' },
      overdue: { variant: 'destructive' as const, icon: XCircle, text: 'Overdue' },
      cancelled: { variant: 'outline' as const, icon: XCircle, text: 'Cancelled' },
    };

    const config = variants[status] || { variant: 'outline' as const, icon: Clock, text: status };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getTransactionIcon = (type: 'invoice' | 'payment' | 'return') => {
    switch (type) {
      case 'invoice':
        return <FileText className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'return':
        return <TrendingDown className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">
              {customer?.name || 'Customer'} - Account Summary
            </h3>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invoiced</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalInvoiced)}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className={cn("p-4", totalDue > 0 && "border-orange-500")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Due</p>
                    <p className={cn("text-2xl font-bold", totalDue > 0 ? "text-orange-600" : "text-green-600")}>
                      {formatCurrency(totalDue)}
                    </p>
                  </div>
                  <div className={cn("p-3 rounded-full", totalDue > 0 ? "bg-orange-100" : "bg-green-100")}>
                    {totalDue > 0 ? (
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    ) : (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Customer Info */}
            {customer && (
              <Card className="p-4">
                <h4 className="font-medium mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Credit Limit:</span>
                    <span className="ml-2 font-medium">{formatCurrency(customer.creditLimit * 100)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Terms:</span>
                    <span className="ml-2 font-medium">{customer.paymentTerms} days</span>
                  </div>
                  {customer.email && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2 font-medium">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="ml-2 font-medium">{customer.phone}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Recent Transactions Preview */}
            <Card className="p-4">
              <h4 className="font-medium mb-3">Recent Transactions</h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-2 rounded border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <div className="font-medium text-sm">{transaction.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(transaction.date)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium",
                          transaction.type === 'payment' ? "text-green-600" : "text-foreground"
                        )}>
                          {transaction.type === 'payment' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                        {getStatusBadge(transaction.status, transaction.type)}
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No transactions found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 bg-accent rounded">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{transaction.description}</span>
                            {getStatusBadge(transaction.status, transaction.type)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(transaction.date)}
                            </div>
                            <div>Ref: {transaction.reference}</div>
                            {transaction.dueAmount !== undefined && transaction.dueAmount > 0 && (
                              <div className="text-orange-600">
                                Due: {formatCurrency(transaction.dueAmount)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-lg font-semibold",
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
                              // Navigate to invoice detail
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

          <TabsContent value="invoices" className="space-y-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{invoice.invoiceNumber}</span>
                          {getStatusBadge(invoice.paymentStatus, 'invoice')}
                          <Badge variant="outline">{invoice.type}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <span className="ml-2">{formatDate(invoice.invoiceDate)}</span>
                          </div>
                          {invoice.dueDate && (
                            <div>
                              <span className="text-muted-foreground">Due Date:</span>
                              <span className="ml-2">{formatDate(invoice.dueDate)}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Total:</span>
                            <span className="ml-2 font-medium">{formatCurrency(invoice.totalCents)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Due:</span>
                            <span className={cn(
                              "ml-2 font-medium",
                              invoice.dueCents > 0 ? "text-orange-600" : "text-green-600"
                            )}>
                              {formatCurrency(invoice.dueCents)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to invoice detail
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
    </Card>
  );
}

