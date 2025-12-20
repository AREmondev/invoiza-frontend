"use client";

import { useQuery, useMutation } from "convex/react";
import { useSession } from "next-auth/react";
import { AdvancedDataTable } from "@/components/ui/advanced-data-table";
import type { AdvancedColumnDef } from "@/components/ui/advanced-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash, DollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { api } from "@/lib/convex";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { AddPaymentMethodDialog } from "@/components/payment-methods/add-payment-method-dialog";
import { EditPaymentMethodDialog } from "@/components/payment-methods/edit-payment-method-dialog";
import { useState, useMemo } from "react";

interface BankListAdvancedProps {
  userId?: string;
}

export function BankListAdvanced({ userId }: BankListAdvancedProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);

  // Fetch bank payment methods
  const bankMethods = useQuery(
    api.queries.paymentMethods.getPaymentMethodsByType,
    userEmail ? { userEmail, type: "bank" } : "skip"
  ) || [];

  // Fetch payment totals by method
  const paymentTotalsByMethod = useQuery(
    api.queries.payments.getPaymentTotalsByMethod,
    userEmail ? { userEmail } : "skip"
  ) || {};

  // Combine bank methods with their totals
  const bankMethodsWithTotals = useMemo(() => {
    return bankMethods.map((method: any) => ({
      ...method,
      totalReceivedCents: paymentTotalsByMethod[method.code] || 0,
    }));
  }, [bankMethods, paymentTotalsByMethod]);

  const deleteMethodMutation = useMutation(api.mutations.paymentMethods.deletePaymentMethod);

  const handleEditMethod = (method: any) => {
    setSelectedMethod(method);
    setEditDialogOpen(true);
  };

  const handleDeleteMethod = async (method: any) => {
    if (!confirm(`Are you sure you want to delete "${method.name}"?`)) {
      return;
    }

    try {
      await deleteMethodMutation({
        methodId: method._id,
        userEmail,
      });
      toast({
        title: "Success",
        description: "Bank account deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bank account",
        variant: "destructive",
      });
    }
  };

  const columns: AdvancedColumnDef<any, unknown>[] = [
    {
      accessorKey: "name",
      header: "Bank Name",
      filterConfig: {
        type: "text",
        placeholder: "Filter by bank name"
      }
    },
    {
      accessorKey: "bankName",
      header: "Bank",
      cell: ({ row }) => {
        const bankName = row.getValue("bankName") as string;
        return bankName || "-";
      },
      filterConfig: {
        type: "text",
        placeholder: "Filter by bank"
      }
    },
    {
      accessorKey: "accountNumber",
      header: "Account Number",
      cell: ({ row }) => {
        const accountNumber = row.getValue("accountNumber") as string;
        return accountNumber ? `****${accountNumber.slice(-4)}` : "-";
      },
      filterConfig: {
        type: "text",
        placeholder: "Filter by account number"
      }
    },
    {
      accessorKey: "accountHolderName",
      header: "Account Holder",
      cell: ({ row }) => {
        const holderName = row.getValue("accountHolderName") as string;
        return holderName || "-";
      },
      filterConfig: {
        type: "text",
        placeholder: "Filter by account holder"
      }
    },
    {
      accessorKey: "balanceCents",
      header: "Current Balance",
      cell: ({ row }) => {
        const balance = row.getValue("balanceCents") as number;
        return (
          <div className="text-right font-medium">
            {formatCurrency(balance || 0)}
          </div>
        );
      },
      filterConfig: {
        type: "range",
        placeholder: "Filter by balance"
      },
      aggregationFn: "sum"
    },
    {
      accessorKey: "totalReceivedCents",
      header: "Total Received",
      cell: ({ row }) => {
        const totalReceived = row.getValue("totalReceivedCents") as number;
        return (
          <div className="text-right font-bold text-primary">
            {formatCurrency(totalReceived || 0)}
          </div>
        );
      },
      filterConfig: {
        type: "range",
        placeholder: "Filter by total received"
      },
      aggregationFn: "sum"
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
      filterConfig: {
        type: "select",
        options: [
          { label: "Active", value: "true" },
          { label: "Inactive", value: "false" }
        ],
        placeholder: "Filter by status"
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const method = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEditMethod(method)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteMethod(method)}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Bank Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Manage your bank accounts and track balances
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      {bankMethods.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">No bank accounts found</p>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        </div>
      ) : (
        <AdvancedDataTable
          columns={columns as any}
          data={bankMethodsWithTotals}
          tableId="banking-accounts"
          userId={userId ?? "default"}
          searchable={true}
          columnVisibility={true}
          pagination={true}
          rowSelection={true}
          enableGrouping={true}
          enableExport={true}
          exportFormats={["csv", "excel"]}
          enableAdvancedFilters={true}
          enableMultiSort={true}
          defaultPageSize={10}
          pageSizeOptions={[5, 10, 25, 50, 100]}
        />
      )}

      <AddPaymentMethodDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      {selectedMethod && (
        <EditPaymentMethodDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          method={selectedMethod}
          onSuccess={() => {
            setEditDialogOpen(false);
            setSelectedMethod(null);
          }}
        />
      )}
    </div>
  );
}
