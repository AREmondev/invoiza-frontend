"use client";

import { useState } from 'react';
import { AdvancedDataTable, AdvancedColumnDef } from '@/components/ui/advanced-data-table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash, Eye, Download, Mail, DollarSign, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Invoice } from '@/types';

// Mock invoice data - in real app this would come from your store
const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-001',
    type: 'sale',
    customerId: '1',
    billingName: 'Acme Corporation',
    invoiceDate: new Date('2024-03-15'),
    dueDate: new Date('2024-04-15'),
    subtotalCents: 250000,
    discountCents: 0,
    discountType: 'percentage',
    discountValue: 0,
    additionalChargesCents: 0,
    taxCents: 25000,
    totalCents: 275000,
    paidCents: 275000,
    dueCents: 0,
    status: 'paid',
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    notes: 'Payment received on time',
    terms: 'Net 30',
    lineItems: [],
    additionalCharges: [],
    payments: [],
    returns: [],
    isLocked: false,
    auditLogs: [],
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
    createdBy: 'user-1',
    updatedBy: 'user-1'
  },
  {
    id: '2',
    invoiceNumber: 'INV-002',
    type: 'sale',
    customerId: '2',
    billingName: 'John Smith',
    invoiceDate: new Date('2024-03-14'),
    dueDate: new Date('2024-04-14'),
    subtotalCents: 120000,
    discountCents: 5000,
    discountType: 'fixed',
    discountValue: 50,
    additionalChargesCents: 0,
    taxCents: 12000,
    totalCents: 127000,
    paidCents: 60000,
    dueCents: 67000,
    status: 'pending',
    paymentStatus: 'partial',
    paymentMethod: 'credit_card',
    notes: 'Partial payment received',
    terms: 'Net 30',
    lineItems: [],
    additionalCharges: [],
    payments: [],
    returns: [],
    isLocked: false,
    auditLogs: [],
    createdAt: new Date('2024-03-14'),
    updatedAt: new Date('2024-03-20'),
    createdBy: 'user-1',
    updatedBy: 'user-1'
  },
  {
    id: '3',
    invoiceNumber: 'INV-003',
    type: 'purchase',
    supplierId: '3',
    billingName: 'Tech Solutions Inc',
    invoiceDate: new Date('2024-03-13'),
    dueDate: new Date('2024-04-13'),
    subtotalCents: 500000,
    discountCents: 20000,
    discountType: 'percentage',
    discountValue: 4,
    additionalChargesCents: 0,
    taxCents: 50000,
    totalCents: 530000,
    paidCents: 0,
    dueCents: 530000,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'bank_transfer',
    notes: 'Awaiting payment',
    terms: 'Net 30',
    lineItems: [],
    additionalCharges: [],
    payments: [],
    returns: [],
    isLocked: false,
    auditLogs: [],
    createdAt: new Date('2024-03-13'),
    updatedAt: new Date('2024-03-13'),
    createdBy: 'user-1',
    updatedBy: 'user-1'
  },
  {
    id: '4',
    invoiceNumber: 'INV-004',
    type: 'sale',
    customerId: '4',
    billingName: 'Sarah Johnson',
    invoiceDate: new Date('2024-03-12'),
    dueDate: new Date('2024-04-12'),
    subtotalCents: 80000,
    discountCents: 0,
    discountType: 'percentage',
    discountValue: 0,
    additionalChargesCents: 0,
    taxCents: 8000,
    totalCents: 88000,
    paidCents: 88000,
    dueCents: 0,
    status: 'paid',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    notes: 'Paid in full',
    terms: 'Net 30',
    lineItems: [],
    additionalCharges: [],
    payments: [],
    returns: [],
    isLocked: false,
    auditLogs: [],
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-25'),
    createdBy: 'user-1',
    updatedBy: 'user-1'
  },
  {
    id: '5',
    invoiceNumber: 'INV-005',
    type: 'purchase',
    supplierId: '5',
    billingName: 'Global Enterprises Ltd',
    invoiceDate: new Date('2024-03-11'),
    dueDate: new Date('2024-04-11'),
    subtotalCents: 1500000,
    discountCents: 50000,
    discountType: 'percentage',
    discountValue: 3.33,
    additionalChargesCents: 0,
    taxCents: 150000,
    totalCents: 1600000,
    paidCents: 0,
    dueCents: 1600000,
    status: 'overdue',
    paymentStatus: 'pending',
    paymentMethod: 'bank_transfer',
    notes: 'Payment overdue - follow up required',
    terms: 'Net 30',
    lineItems: [],
    additionalCharges: [],
    payments: [],
    returns: [],
    isLocked: false,
    auditLogs: [],
    createdAt: new Date('2024-03-11'),
    updatedAt: new Date('2024-04-15'),
    createdBy: 'user-1',
    updatedBy: 'user-1'
  }
];

interface InvoiceListAdvancedProps {
  userId: string;
}

export function InvoiceListAdvanced({ userId }: InvoiceListAdvancedProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    console.log('Edit invoice:', invoice);
    // TODO: Implement edit invoice modal
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    console.log('Delete invoice:', invoice);
    // TODO: Implement delete invoice confirmation
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    console.log('Download invoice:', invoice);
    // TODO: Implement invoice download functionality
  };

  const handleSendReminder = (invoice: Invoice) => {
    console.log('Send reminder for invoice:', invoice);
    // TODO: Implement reminder email functionality
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Approved</Badge>;
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
        return <Badge variant="outline" className="border-green-200 text-green-700">Sale</Badge>;
      case 'purchase':
        return <Badge variant="outline" className="border-blue-200 text-blue-700">Purchase</Badge>;
      case 'return':
        return <Badge variant="outline" className="border-red-200 text-red-700">Return</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Advanced column definitions with comprehensive filtering
  const columns: AdvancedColumnDef<Invoice, any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 40,
    },
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
          { label: "Return", value: "return" }
        ],
        placeholder: "Filter by type"
      },
      size: 100,
    },
    {
      accessorKey: "billingName",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("billingName")}</div>
          <div className="text-xs text-gray-500">ID: {row.original.customerId}</div>
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Search customers..."
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
        const dueDate = new Date(row.getValue("dueDate"));
        const daysUntilDue = getDaysUntilDue(dueDate);
        const isOverdue = daysUntilDue < 0;
        
        return (
          <div className="text-sm">
            <div>{format(dueDate, "MMM dd, yyyy")}</div>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                {Math.abs(daysUntilDue)} days overdue
              </Badge>
            )}
            {daysUntilDue >= 0 && daysUntilDue <= 7 && (
              <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800">
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
        const total = (row.getValue("totalCents") as number) / 100;
        return (
          <div className="text-right">
            <div className="font-medium">${total.toLocaleString()}</div>
            <div className="text-xs text-gray-500">
              Tax: ${((row.original.taxCents as number) / 100).toLocaleString()}
            </div>
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
      accessorKey: "dueCents",
      header: "Balance",
      cell: ({ row }) => {
        const balance = (row.getValue("dueCents") as number) / 100;
        const total = (row.original.totalCents as number) / 100;
        const paidPercentage = ((total - balance) / total) * 100;
        
        return (
          <div className="text-right">
            <div className={`font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${balance.toLocaleString()}
            </div>
            {balance > 0 && (
              <div className="text-xs text-gray-500">
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as InvoiceStatus;
        return getStatusBadge(status);
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "multi-select",
        options: [
          { label: "Paid", value: "paid" },
          { label: "Pending", value: "pending" },
          { label: "Partial", value: "partial" },
          { label: "Overdue", value: "overdue" },
          { label: "Cancelled", value: "cancelled" }
        ],
        placeholder: "Filter by status"
      },
      size: 100,
    },
    {
      id: "daysOverdue",
      header: "Days Overdue",
      cell: ({ row }) => {
        const dueDate = new Date(row.original.dueDate);
        const daysOverdue = getDaysUntilDue(dueDate);
        
        if (daysOverdue >= 0) return <span className="text-sm">-</span>;
        
        return (
          <Badge variant="destructive" className="text-xs">
            {Math.abs(daysOverdue)} days
          </Badge>
        );
      },
      enableSorting: true,
      enableColumnFilter: false,
      size: 100,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const invoice = row.original;
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
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleDownloadInvoice(invoice)}
              title="Download Invoice"
            >
              <Download className="h-3 w-3" />
            </Button>
            {invoice.status !== "paid" && (
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
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleEditInvoice(invoice)}
              title="Edit Invoice"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => handleDeleteInvoice(invoice)}
              title="Delete Invoice"
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      size: 140,
    },
  ];

  const actions = [
    {
      label: "Download Selected",
      action: handleDownloadInvoice,
      icon: <Download className="h-4 w-4" />,
    },
    {
      label: "Send Reminders",
      action: handleSendReminder,
      icon: <Mail className="h-4 w-4" />,
    },
    {
      label: "Export to Excel",
      action: (invoice: Invoice) => {
        console.log('Export invoice:', invoice);
        // TODO: Implement export functionality
      },
      icon: <DollarSign className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Invoice Management</h2>
          <Badge variant="secondary" className="text-sm">
            {mockInvoices.length} invoices
          </Badge>
          <Badge variant="outline" className="text-sm">
            Total: ${mockInvoices.reduce((sum, inv) => sum + inv.totalCents, 0).toLocaleString()}
          </Badge>
          <Badge variant="outline" className="text-sm text-red-600">
            Outstanding: ${mockInvoices.reduce((sum, inv) => sum + inv.dueCents, 0).toLocaleString()}
          </Badge>
        </div>
      </div>

      <AdvancedDataTable
        columns={columns as AdvancedColumnDef<unknown, unknown>[]}
        data={mockInvoices}
        tableId="invoices"
        userId={userId}
        searchable={true}
        columnVisibility={true}
        pagination={true}
        rowSelection={true}
        actions={actions}
        enableGrouping={true}
        enableAggregating={true}
        enableExport={true}
        exportFormats={["csv", "excel"]}
        enableAdvancedFilters={true}
        enableMultiSort={true}
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20, 50, 100]}
        onRowClick={handleViewInvoice}
        onSelectionChange={(selectedInvoices) => {
          console.log('Selected invoices:', selectedInvoices);
          const totalSelected = selectedInvoices.reduce((sum, inv) => sum + inv.totalCents, 0);
          console.log('Total selected amount:', totalSelected);
        }}
      />

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">Invoice {selectedInvoice.invoiceNumber}</h2>
                <p className="text-gray-600">{selectedInvoice.customerName}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedInvoice(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Invoice Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Type:</strong> {getTypeBadge(selectedInvoice.type)}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedInvoice.status)}</div>
                    <div><strong>Date:</strong> {format(selectedInvoice.invoiceDate, "MMM dd, yyyy")}</div>
                    <div><strong>Due Date:</strong> {format(selectedInvoice.dueDate!, "MMM dd, yyyy")}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Amount Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Subtotal:</span> <span>${(selectedInvoice.subtotalCents / 100).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Tax:</span> <span>${(selectedInvoice.taxCents / 100).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Discount:</span> <span>-${(selectedInvoice.discountCents / 100).toLocaleString()}</span></div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold"><span>Total:</span> <span>${(selectedInvoice.totalCents / 100).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Paid:</span> <span>${(selectedInvoice.paidCents / 100).toLocaleString()}</span></div>
                    <div className="flex justify-between text-red-600"><span>Balance:</span> <span>${(selectedInvoice.dueCents / 100).toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="text-sm">
                    <div><strong>Name:</strong> {selectedInvoice.billingName}</div>
                    <div><strong>ID:</strong> {selectedInvoice.customerId}</div>
                  </div>
                </div>
                
                {selectedInvoice.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-gray-600">{selectedInvoice.notes}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold mb-2">Timeline</h3>
                  <div className="text-sm space-y-1">
                    <div><strong>Created:</strong> {format(selectedInvoice.createdAt, "MMM dd, yyyy HH:mm")}</div>
                    <div><strong>Updated:</strong> {format(selectedInvoice.updatedAt, "MMM dd, yyyy HH:mm")}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
              <Button onClick={() => handleDownloadInvoice(selectedInvoice)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}