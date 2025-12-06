"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useSession } from 'next-auth/react';
import { AdvancedDataTable, AdvancedColumnDef, ColumnFilterConfig } from '@/components/ui/advanced-data-table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash, Eye, Mail, Phone } from 'lucide-react';
import { AddCustomerDialog } from './add-customer-dialog';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/types';
import { format } from 'date-fns';
import { api } from '@/lib/convex';
import { useToast } from '@/hooks/use-toast';
import { CustomerDetailsModal } from '../shared';

interface CustomerListWithAdvancedTableProps {
  userId: string;
}

export function CustomerListWithAdvancedTable({ userId }: CustomerListWithAdvancedTableProps) {
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();

  // Load customers from Convex
  const customers = useQuery(
    api.queries.customers.getCustomers,
    userEmail ? { userEmail } : "skip"
  ) || [];

  // Convert Convex customers to Customer type
  const convertedCustomers: Customer[] = customers.map((c: any) => ({
    id: c._id,
    name: c.name,
    type: c.type || 'individual',
    email: c.email,
    phone: c.phone || c.mobile,
    status: c.status || 'active',
    billingAliases: c.billingAliases || [],
    addresses: c.addresses || [],
    metadata: {
      ...(c.metadata || {}),
      totalSalesCents: c.totalSalesCents || 0,
      totalSalesCount: c.totalSalesCount || 0,
      totalDueCents: c.totalDueCents || 0,
      lastSaleDate: c.lastSaleDate,
      nextDueDate: c.nextDueDate,
    },
  }));

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleEditCustomer = (customer: Customer) => {
    console.log('Edit customer:', customer);
    // TODO: Implement edit customer modal
  };

  const handleDeleteCustomer = (customer: Customer) => {
    console.log('Delete customer:', customer);
    // TODO: Implement delete customer confirmation
  };

  const handleSendEmail = (customer: Customer) => {
    console.log('Send email to:', customer.email);
    // TODO: Implement email functionality
  };

  const handleCallCustomer = (customer: Customer) => {
    console.log('Call customer:', customer.phone);
    // TODO: Implement call functionality
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'business':
        return <Badge variant="outline" className="border-blue-200 text-blue-700">Business</Badge>;
      case 'individual':
        return <Badge variant="outline" className="border-purple-200 text-purple-700">Individual</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Advanced column definitions with filter configurations
  const columns: AdvancedColumnDef<Customer>[] = [
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
      accessorKey: "name",
      header: "Customer Name",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div>
            <div className="font-medium">{customer.name}</div>
            <div className="text-sm text-gray-500">
              {customer.billingAliases?.[0] || 'No alias'}
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Search by name..."
      },
      size: 200,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => getTypeBadge(row.getValue("type")),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "select",
        options: [
          { label: "Business", value: "business" },
          { label: "Individual", value: "individual" }
        ],
        placeholder: "Filter by type"
      },
      size: 120,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-3 w-3 text-gray-400" />
          <span className="text-sm">{row.getValue("email")}</span>
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by email..."
      },
      size: 200,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-gray-400" />
          <span className="text-sm">{row.getValue("phone")}</span>
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by phone..."
      },
      size: 150,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "select",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
          { label: "Suspended", value: "suspended" }
        ],
        placeholder: "Filter by status"
      },
      size: 100,
    },
    {
      accessorKey: "metadata.creditLimit",
      header: "Credit Limit",
      cell: ({ row }) => {
        const creditLimit = row.original.metadata?.creditLimit || 0;
        return (
          <div className="text-right">
            <div className="font-medium">${creditLimit.toLocaleString()}</div>
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "range",
        placeholder: "Filter by credit limit"
      },
      size: 120,
    },
    {
      accessorKey: "metadata.paymentTerms",
      header: "Payment Terms",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.metadata?.paymentTerms || 'N/A'}
        </Badge>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "multi-select",
        options: [
          { label: "Net 15", value: "Net 15" },
          { label: "Net 30", value: "Net 30" },
          { label: "Net 45", value: "Net 45" },
          { label: "Net 60", value: "Net 60" }
        ],
        placeholder: "Filter by terms"
      },
      size: 120,
    },
    {
      accessorKey: "metadata.registrationDate",
      header: "Registration Date",
      cell: ({ row }) => {
        const date = row.original.metadata?.registrationDate;
        return date ? format(new Date(date), "MMM dd, yyyy") : 'N/A';
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "date",
        placeholder: "Filter by date"
      },
      size: 120,
    },
    {
      accessorKey: "addresses",
      header: "Location",
      cell: ({ row }) => {
        const address = row.original.addresses?.[0];
        return address ? (
          <div className="text-sm">
            <div>{address.city}</div>
            <div className="text-gray-500">{address.state}</div>
          </div>
        ) : 'N/A';
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by location..."
      },
      size: 120,
    },
    {
      accessorKey: "metadata.totalSalesCents",
      header: "Total Sales",
      cell: ({ row }) => {
        const totalSales = row.original.metadata?.totalSalesCents || 0;
        const salesCount = row.original.metadata?.totalSalesCount || 0;
        return (
          <div className="text-right">
            <div className="font-medium">${(totalSales / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-muted-foreground">{salesCount} sale{salesCount !== 1 ? 's' : ''}</div>
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "range",
        min: 0,
        max: 1000000,
        placeholder: "Filter by total sales"
      },
      size: 140,
    },
    {
      accessorKey: "metadata.totalDueCents",
      header: "Total Due",
      cell: ({ row }) => {
        const totalDue = row.original.metadata?.totalDueCents || 0;
        return (
          <div className={totalDue > 0 ? "text-right text-orange-600 font-semibold" : "text-right text-green-600"}>
            ${(totalDue / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "range",
        min: 0,
        max: 100000,
        placeholder: "Filter by due amount"
      },
      size: 120,
    },
    {
      accessorKey: "metadata.nextDueDate",
      header: "Next Due Date",
      cell: ({ row }) => {
        const nextDueDate = row.original.metadata?.nextDueDate;
        if (!nextDueDate) return <span className="text-muted-foreground">No due</span>;
        
        const dueDate = new Date(nextDueDate);
        const isOverdue = dueDate < new Date();
        
        return (
          <div className={isOverdue ? "text-red-600 font-medium" : ""}>
            {format(dueDate, "MMM dd, yyyy")}
            {isOverdue && <Badge variant="destructive" className="ml-2 text-xs">Overdue</Badge>}
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "date",
        placeholder: "Filter by due date"
      },
      size: 150,
    },
    {
      accessorKey: "metadata.lastSaleDate",
      header: "Last Sale",
      cell: ({ row }) => {
        const lastSaleDate = row.original.metadata?.lastSaleDate;
        return lastSaleDate ? format(new Date(lastSaleDate), "MMM dd, yyyy") : 'Never';
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "date",
        placeholder: "Filter by last sale"
      },
      size: 120,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleViewCustomer(customer)}
              title="View Details"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleSendEmail(customer)}
              title="Send Email"
            >
              <Mail className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleCallCustomer(customer)}
              title="Call Customer"
            >
              <Phone className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleEditCustomer(customer)}
              title="Edit Customer"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => handleDeleteCustomer(customer)}
              title="Delete Customer"
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
      label: "Send Email",
      action: handleSendEmail,
      icon: <Mail className="h-4 w-4" />,
    },
    {
      label: "Export Selected",
      action: (customer: Customer) => {
        console.log('Export customer:', customer);
        // TODO: Implement export functionality
      },
      icon: <Eye className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Customer Directory</h2>
          <Badge variant="secondary" className="text-sm">
            {convertedCustomers.length} customers
          </Badge>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <AdvancedDataTable
        columns={columns}
        data={convertedCustomers}
        tableId="customers"
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
        onRowClick={handleViewCustomer}
        onSelectionChange={(selectedCustomers) => {
          console.log('Selected customers:', selectedCustomers);
        }}
      />

      {/* Customer Details Modal */}
      {selectedCustomer && (
            <CustomerDetailsModal
            customerId={selectedCustomer.id || null}
            open={true}
            onOpenChange={() => setSelectedCustomer(null)}
          />
      )}

      <AddCustomerDialog 
        open={open} 
        onOpenChange={setOpen}
        onCustomerAdded={() => {
          // Customer list will automatically refresh via useQuery
          toast({
            title: "Success",
            description: "Customer added successfully.",
          });
        }}
      />
    </div>
  );
}