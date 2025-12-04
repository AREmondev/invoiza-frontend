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
    metadata: c.metadata || {},
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedCustomer(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Email:</strong> {selectedCustomer.email}</div>
                    <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
                    <div><strong>Type:</strong> {getTypeBadge(selectedCustomer.type)}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedCustomer.status)}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Billing Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Credit Limit:</strong> ${selectedCustomer.metadata?.creditLimit?.toLocaleString()}</div>
                    <div><strong>Payment Terms:</strong> {selectedCustomer.metadata?.paymentTerms}</div>
                    <div><strong>Registration Date:</strong> {selectedCustomer.metadata?.registrationDate}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  {selectedCustomer.addresses?.[0] && (
                    <div className="text-sm">
                      <div>{selectedCustomer.addresses[0].street}</div>
                      <div>{selectedCustomer.addresses[0].city}, {selectedCustomer.addresses[0].state} {selectedCustomer.addresses[0].zipCode}</div>
                      <div>{selectedCustomer.addresses[0].country}</div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Billing Aliases</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedCustomer.billingAliases?.map((alias, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {alias}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                Close
              </Button>
              <Button onClick={() => handleEditCustomer(selectedCustomer)}>
                Edit Customer
              </Button>
            </div>
          </div>
        </div>
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