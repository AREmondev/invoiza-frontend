"use client";

import { AdvancedDataTable } from "@/components/ui/advanced-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdvancedColumnDef } from "@/components/ui/advanced-data-table";

interface SalesListAdvancedProps {
  userId?: string;
}

// Mock data for sales
const salesData = [
  { id: "INV-001", customer: "John Doe", date: "2024-10-01", amount: 250.0, paymentStatus: "Paid", paymentMethod: "Cash", whatsapp: "+1234567890" },
  { id: "INV-002", customer: "Jane Smith", date: "2024-10-02", amount: 150.5, paymentStatus: "Due", paymentMethod: "Bank", whatsapp: "+1987654321" },
  { id: "INV-003", customer: "Acme Corp", date: "2024-10-03", amount: 320.0, paymentStatus: "Partial", paymentMethod: "Mobile Banking", whatsapp: "+1122334455" },
  { id: "INV-004", customer: "Tech Solutions", date: "2024-10-04", amount: 875.25, paymentStatus: "Paid", paymentMethod: "Bank", whatsapp: "+1555666777" },
  { id: "INV-005", customer: "Global Retail", date: "2024-10-05", amount: 1200.0, paymentStatus: "Due", paymentMethod: "Cash", whatsapp: "+1444333222" },
];

export function SalesListAdvanced({ userId }: SalesListAdvancedProps) {
  const columns: AdvancedColumnDef<typeof salesData[0], any>[] = [
    {
      accessorKey: "id",
      header: "Invoice #",
      filterConfig: {
        type: "text",
        placeholder: "Filter by invoice number"
      }
    },
    {
      accessorKey: "customer",
      header: "Customer",
      filterConfig: {
        type: "text",
        placeholder: "Filter by customer name"
      }
    },
    {
      accessorKey: "date",
      header: "Date",
      filterConfig: {
        type: "date",
        placeholder: "Filter by date"
      }
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `৳${(row.getValue("amount") as number).toFixed(2)}`,
      filterConfig: {
        type: "range",
        min: 0,
        max: 2000,
        placeholder: "Filter by amount range"
      }
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment Status",
      cell: ({ row }) => {
        const paymentStatus = row.getValue("paymentStatus") as string;
        return (
          <Badge 
            variant={paymentStatus === "Paid" ? "default" : 
                    paymentStatus === "Partial" ? "secondary" : 
                    "destructive"}
          >
            {paymentStatus}
          </Badge>
        );
      },
      filterConfig: {
        type: "select",
        options: [
          { label: "Paid", value: "Paid" },
          { label: "Due", value: "Due" },
          { label: "Partial", value: "Partial" }
        ],
        placeholder: "Filter by payment status"
      }
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      filterConfig: {
        type: "select",
        options: [
          { label: "Cash", value: "Cash" },
          { label: "Bank", value: "Bank" },
          { label: "Mobile Banking", value: "Mobile Banking" }
        ],
        placeholder: "Filter by payment method"
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const sale = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(sale.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(sale.id)}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleWhatsAppShare(sale.whatsapp, sale.id, sale.amount)}>
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleEdit = (saleId: string) => {
    console.log("Edit sale:", saleId);
  };

  const handleDelete = (saleId: string) => {
    console.log("Delete sale:", saleId);
  };

  const handleWhatsAppShare = (number: string, saleId: string, amount: number) => {
    const text = encodeURIComponent(`Invoice ${saleId} amount ${amount} is ${salesData.find((s) => s.id === saleId)?.paymentStatus || "Paid"}. Thank you!`);
    const url = `https://wa.me/${number}?text=${text}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      <AdvancedDataTable
        columns={columns as AdvancedColumnDef<unknown, unknown>[]}
        data={salesData}
        tableId="sales"
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