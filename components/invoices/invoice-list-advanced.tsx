"use client";

import { useState, useMemo } from 'react';
import { AdvancedDataTable, AdvancedColumnDef } from '@/components/ui/advanced-data-table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash, Eye, Download, Mail, DollarSign, Calendar, User, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useQuery, useMutation } from 'convex/react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/convex';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { InvoicePaymentModal } from './invoice-payment-modal';
import { InvoiceDetailView } from './invoice-detail-view';

interface InvoiceListAdvancedProps {
  userId: string;
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

export function InvoiceListAdvanced({ userId }: InvoiceListAdvancedProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState<any | null>(null);

  // Fetch all invoices (sales and purchases)
  const salesInvoices = useQuery(
    api.queries.invoices.getInvoices,
    userEmail ? { userEmail, type: "sale" } : "skip"
  ) || [];

  const purchaseInvoices = useQuery(
    api.queries.invoices.getInvoices,
    userEmail ? { userEmail, type: "purchase" } : "skip"
  ) || [];

  // Fetch payments for all invoices
  const allInvoiceIds = useMemo(() => {
    return [...salesInvoices, ...purchaseInvoices].map((inv: any) => inv._id);
  }, [salesInvoices, purchaseInvoices]);

  // Combine all invoices
  const allInvoices = useMemo(() => {
    const combined = [...salesInvoices, ...purchaseInvoices];
    
    // Transform to match Invoice type
    return combined.map((invoice: any) => {
      // Calculate due amount from payments
      const calculatedDueCents = Math.max(0, invoice.totalCents - (invoice.paidCents || 0));
      
      // Determine payment status
      let paymentStatus = invoice.paymentStatus || 'pending';
      if (calculatedDueCents === 0 && invoice.totalCents > 0) {
        paymentStatus = 'paid';
      } else if (calculatedDueCents > 0 && calculatedDueCents < invoice.totalCents) {
        paymentStatus = 'partial';
      } else if (calculatedDueCents === invoice.totalCents) {
        paymentStatus = 'pending';
      }

      return {
        ...invoice,
        id: invoice._id,
        billingName: invoice.customerName || invoice.billingName || 'N/A',
        invoiceDate: new Date(invoice.invoiceDate),
        dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
        calculatedDueCents,
        paymentStatus,
      };
    });
  }, [salesInvoices, purchaseInvoices]);

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setDetailViewOpen(true);
  };

  const handleMakePayment = (invoice: any) => {
    setInvoiceToPay(invoice);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setInvoiceToPay(null);
    toast({
      title: "Success",
      description: "Payment processed successfully",
    });
  };

  const handleEditInvoice = (invoice: any) => {
    toast({
      title: "Coming Soon",
      description: "Edit functionality will be available soon",
    });
  };

  const handleDeleteInvoice = (invoice: any) => {
    toast({
      title: "Coming Soon",
      description: "Delete functionality will be available soon",
    });
  };

  const handleDownloadInvoice = (invoice: any) => {
    toast({
      title: "Coming Soon",
      description: "Download functionality will be available soon",
    });
  };

  const handleSendReminder = (invoice: any) => {
    toast({
      title: "Coming Soon",
      description: "Reminder functionality will be available soon",
    });
  };

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
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'draft':
        return <Badge variant="outline" className="border-gray-300">Draft</Badge>;
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
      case 'return':
        return <Badge variant="outline" className="border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">Return</Badge>;
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

  // Advanced column definitions
  const columns: AdvancedColumnDef<any, any>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }) => (
        <div className="font-mono text-sm font-medium">
          {row.getValue("invoiceNumber")}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Search invoice numbers..."
      },
      size: 120,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => getTypeBadge(row.getValue("type")),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "multi-select",
        options: [
          { label: "Sale", value: "sale" },
          { label: "Purchase", value: "purchase" },
        ],
        placeholder: "Filter by type"
      },
      size: 100,
    },
    {
      accessorKey: "billingName",
      header: ({ column }) => column.id === 'type' && column.getFilterValue() === 'sale' ? "Customer" : "Supplier",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("billingName")}</div>
          {row.original.customerId && (
            <div className="text-xs text-muted-foreground">ID: {row.original.customerId}</div>
          )}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Search by name..."
      },
      size: 180,
    },
    {
      accessorKey: "invoiceDate",
      header: "Invoice Date",
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.getValue("invoiceDate")), "MMM dd, yyyy")}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "date",
        placeholder: "Filter by date"
      },
      size: 120,
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const dueDate = row.getValue("dueDate") as Date | undefined;
        if (!dueDate) return <span className="text-muted-foreground text-sm">No due date</span>;
        
        const daysUntilDue = getDaysUntilDue(dueDate);
        const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
        
        return (
          <div className="text-sm">
            <div>{format(dueDate, "MMM dd, yyyy")}</div>
            {isOverdue && daysUntilDue !== null && (
              <Badge variant="destructive" className="text-xs mt-1">
                {Math.abs(daysUntilDue)} days overdue
              </Badge>
            )}
            {daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7 && (
              <Badge variant="default" className="text-xs mt-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                {daysUntilDue} days left
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "date",
        placeholder: "Filter by due date"
      },
      size: 140,
    },
    {
      accessorKey: "totalCents",
      header: "Total Amount",
      cell: ({ row }) => {
        const totalCents = row.getValue("totalCents") as number;
        const taxCents = row.original.taxCents || 0;
        return (
          <div className="text-right">
            <div className="font-medium">{formatCurrency(totalCents)}</div>
            {taxCents > 0 && (
              <div className="text-xs text-muted-foreground">
                Tax: {formatCurrency(taxCents)}
              </div>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "range",
        placeholder: "Filter by amount"
      },
      aggregationFn: "sum",
      size: 120,
    },
    {
      accessorKey: "calculatedDueCents",
      header: "Balance",
      cell: ({ row }) => {
        const balanceCents = row.getValue("calculatedDueCents") as number;
        const totalCents = row.original.totalCents as number;
        const paidPercentage = totalCents > 0 ? ((totalCents - balanceCents) / totalCents) * 100 : 0;
        
        return (
          <div className="text-right">
            <div className={cn(
              "font-medium",
              balanceCents > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            )}>
              {formatCurrency(balanceCents)}
            </div>
            {balanceCents > 0 && (
              <div className="text-xs text-muted-foreground">
                {paidPercentage.toFixed(0)}% paid
              </div>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "range",
        placeholder: "Filter by balance"
      },
      aggregationFn: "sum",
      size: 120,
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("paymentStatus") as string;
        return getStatusBadge(status);
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "multi-select",
        options: [
          { label: "Paid", value: "paid" },
          { label: "Partial", value: "partial" },
          { label: "Pending", value: "pending" },
          { label: "Overdue", value: "overdue" },
        ],
        placeholder: "Filter by status"
      },
      size: 100,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const invoice = row.original;
        const hasDueAmount = invoice.calculatedDueCents > 0;
        
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleViewInvoice(invoice)}
              title="View Invoice"
            >
              <Eye className="h-3 w-3" />
            </Button>
            {hasDueAmount && invoice.type === 'sale' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 dark:text-green-400"
                onClick={() => handleMakePayment(invoice)}
                title="Make Payment"
              >
                <DollarSign className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleDownloadInvoice(invoice)}
              title="Download Invoice"
            >
              <Download className="h-3 w-3" />
            </Button>
            {hasDueAmount && invoice.type === 'sale' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleSendReminder(invoice)}
                title="Send Reminder"
              >
                <Mail className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      size: 140,
    },
  ];

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalInvoices = allInvoices.length;
    const totalAmount = allInvoices.reduce((sum, inv) => sum + (inv.totalCents || 0), 0);
    const totalDue = allInvoices.reduce((sum, inv) => sum + (inv.calculatedDueCents || 0), 0);
    const totalPaid = totalAmount - totalDue;
    const salesCount = allInvoices.filter(inv => inv.type === 'sale').length;
    const purchasesCount = allInvoices.filter(inv => inv.type === 'purchase').length;
    
    return {
      totalInvoices,
      totalAmount,
      totalDue,
      totalPaid,
      salesCount,
      purchasesCount,
    };
  }, [allInvoices]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold">{summaryStats.totalInvoices}</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{summaryStats.salesCount} Sales</span>
              <span>•</span>
              <span>{summaryStats.purchasesCount} Purchases</span>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalAmount)}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summaryStats.totalPaid)}
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(summaryStats.totalDue)}
            </p>
          </div>
        </Card>
      </div>

      {/* Invoice Table */}
      <AdvancedDataTable
        columns={columns as AdvancedColumnDef<unknown, unknown>[]}
        data={allInvoices}
        tableId="invoices"
        userId={userId}
        searchable={true}
        columnVisibility={true}
        pagination={true}
        rowSelection={true}
        enableGrouping={true}
        enableAggregating={true}
        enableExport={true}
        exportFormats={["csv", "excel"]}
        enableAdvancedFilters={true}
        enableMultiSort={true}
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20, 50, 100]}
        onRowClick={handleViewInvoice}
      />

      {/* Payment Modal */}
      {invoiceToPay && (
        <InvoicePaymentModal
          invoice={invoiceToPay}
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Invoice Detail View */}
      {selectedInvoice && (
        <InvoiceDetailView
          invoice={selectedInvoice}
          open={detailViewOpen}
          onOpenChange={setDetailViewOpen}
          onMakePayment={() => {
            setDetailViewOpen(false);
            setInvoiceToPay(selectedInvoice);
            setPaymentModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
