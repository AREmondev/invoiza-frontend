"use client";

import { AdvancedDataTable } from "@/components/ui/advanced-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import type { AdvancedColumnDef } from "@/components/ui/advanced-data-table";
import type { Invoice } from "@/types/models";

interface PurchasesListAdvancedProps {
  onEditPurchase?: (purchase: Invoice) => void;
  userId?: string;
}

// Mock data for purchases
const purchasesData = [
  {
    id: "1",
    purchaseNumber: "PO-001",
    supplierName: "Supplier Co.",
    date: new Date("2024-03-15"),
    amount: 1299.99,
    status: "Received",
    paymentStatus: "Paid",
  },
  {
    id: "2",
    purchaseNumber: "PO-002",
    supplierName: "Tech Supplies Ltd",
    date: new Date("2024-03-14"),
    amount: 2149.5,
    status: "Pending",
    paymentStatus: "Unpaid",
  },
  {
    id: "3",
    purchaseNumber: "PO-003",
    supplierName: "Global Electronics",
    date: new Date("2024-03-13"),
    amount: 899.25,
    status: "Received",
    paymentStatus: "Partial",
  },
  {
    id: "4",
    purchaseNumber: "PO-004",
    supplierName: "Office World",
    date: new Date("2024-03-12"),
    amount: 3245.75,
    status: "Cancelled",
    paymentStatus: "Unpaid",
  },
  {
    id: "5",
    purchaseNumber: "PO-005",
    supplierName: "Industrial Supplies",
    date: new Date("2024-03-11"),
    amount: 1750.0,
    status: "Pending",
    paymentStatus: "Paid",
  },
];

export function PurchasesListAdvanced({
  onEditPurchase,
  userId,
}: PurchasesListAdvancedProps) {
  const columns: AdvancedColumnDef<(typeof purchasesData)[0], any>[] = [
    {
      id: "purchaseNumber",
      accessorKey: "purchaseNumber",
      header: "Purchase #",
      filterConfig: {
        type: "text",
        placeholder: "Filter by purchase number",
      },
    },
    {
      id: "supplierName",
      accessorKey: "supplierName",
      header: "Supplier",
      filterConfig: {
        type: "text",
        placeholder: "Filter by supplier name",
      },
    },
    {
      id: "date",
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(row.getValue("date"), "MMM dd, yyyy"),
      filterConfig: {
        type: "date",
        placeholder: "Filter by date",
      },
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `৳${(row.getValue("amount") as number).toFixed(2)}`,
      filterConfig: {
        type: "range",
        min: 0,
        max: 10000,
        placeholder: "Filter by amount range",
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant={
              status === "Received"
                ? "default"
                : status === "Pending"
                ? "secondary"
                : status === "Cancelled"
                ? "destructive"
                : "outline"
            }
          >
            {status}
          </Badge>
        );
      },
      filterConfig: {
        type: "select",
        options: [
          { label: "Received", value: "Received" },
          { label: "Pending", value: "Pending" },
          { label: "Cancelled", value: "Cancelled" },
        ],
        placeholder: "Filter by status",
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment Status",
      cell: ({ row }) => {
        const paymentStatus = row.getValue("paymentStatus") as string;
        return (
          <Badge
            variant={
              paymentStatus === "Paid"
                ? "default"
                : paymentStatus === "Partial"
                ? "secondary"
                : "destructive"
            }
          >
            {paymentStatus}
          </Badge>
        );
      },
      filterConfig: {
        type: "select",
        options: [
          { label: "Paid", value: "Paid" },
          { label: "Unpaid", value: "Unpaid" },
          { label: "Partial", value: "Partial" },
        ],
        placeholder: "Filter by payment status",
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const purchase = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(purchase)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(purchase.id)}
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

  const handleEdit = (purchase: (typeof purchasesData)[0]) => {
    if (onEditPurchase) {
      // Convert the mock data to PurchaseInvoice format
      const purchaseInvoice: Invoice = {
        id: purchase.id,
        supplierId: purchase.supplierName,
        invoiceNumber: purchase.purchaseNumber,
        type: "purchase",
        invoiceDate: purchase.date,
        status: purchase.status.toLowerCase() as any,
        paymentStatus: purchase.paymentStatus.toLowerCase() as any,
        paymentMethod: "cash",
        lineItems: [],
        additionalCharges: [],
        payments: [],
        returns: [],
        auditLogs: [],
        subtotalCents: purchase.amount * 100,
        discountCents: 0,
        discountType: "percentage",
        discountValue: 0,
        additionalChargesCents: 0,
        taxCents: 0,
        totalCents: purchase.amount * 100,
        paidCents:
          purchase.paymentStatus === "Paid" ? purchase.amount * 100 : 0,
        dueCents:
          purchase.paymentStatus === "Unpaid" ? purchase.amount * 100 : 0,
        isLocked: false,
        createdAt: purchase.date,
        updatedAt: new Date(),
        createdBy: "system",
        updatedBy: "system",
      };
      onEditPurchase(purchaseInvoice);
    }
  };

  const handleDelete = (id: string) => {
    // Implement delete logic here
    console.log("Delete purchase:", id);
  };

  return (
    <div className="space-y-4">
      <AdvancedDataTable
        columns={columns as AdvancedColumnDef<unknown, unknown>[]}
        data={purchasesData}
        tableId="purchases"
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
    </div>
  );
}