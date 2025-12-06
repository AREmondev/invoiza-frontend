"use client";

import { useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AdvancedColumnDef } from "@/components/ui/advanced-data-table";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SalesListAdvancedProps {
  userId?: string;
}

export function SalesListAdvanced({ userId }: SalesListAdvancedProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<{ id: string; invoiceNumber: string; _id: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch sales invoices from Convex
  const invoices = useQuery(
    api.queries.invoices.getInvoices,
    userEmail ? { userEmail, type: "sale" } : "skip"
  ) || [];

  // Delete mutation
  const deleteInvoiceMutation = useMutation(api.mutations.invoices.deleteInvoice);

  // Transform invoices to match table format
  const salesData = invoices.map((invoice: any) => ({
    id: invoice.invoiceNumber,
    customer: invoice.customerName || invoice.billingName || "N/A",
    date: format(new Date(invoice.invoiceDate), "yyyy-MM-dd"),
    amount: invoice.totalCents / 100,
    paymentStatus: invoice.paymentStatus === "paid" ? "Paid" : 
                   invoice.paymentStatus === "partial" ? "Partial" : 
                   invoice.paymentStatus === "overpaid" ? "Overpaid" : "Due",
    paymentMethod: invoice.paymentMethod || "N/A",
    whatsapp: "", // Will be fetched from customer if needed
    _id: invoice._id, // Store Convex ID for operations
  }));

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
      accessorKey: "paymentStatus",
      header: "Actions",
      cell: ({ row }) => {
        const sale = row.original;
        
        return (
          <div className="flex items-center gap-3 mt-2">

          {/* Delete Button */}
          <button
            onClick={() => handleDelete(sale._id, sale.id)}
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
          >
            <Trash className="h-4 w-4" />
            <span>Delete</span>
          </button>
        
          {/* WhatsApp Button */}
          {sale.whatsapp && (
            <button
              onClick={() =>
                handleWhatsAppShare(sale.whatsapp, sale.id, sale.amount)
              }
              className="flex items-center gap-1 text-green-600 hover:text-green-700"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
            </button>
          )}
        
        </div>
        );
      },
    },
  ];

  const handleEdit = (saleId: string) => {
    console.log("Edit sale:", saleId);
    // TODO: Implement edit functionality
  };

  const handleDelete = (invoiceId: string, invoiceNumber: string) => {
    setSaleToDelete({
      id: invoiceNumber,
      invoiceNumber: invoiceNumber,
      _id: invoiceId,
    });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!saleToDelete) return;

    setIsDeleting(true);
    try {
      await deleteInvoiceMutation({
        invoiceId: saleToDelete._id as any,
        userEmail: userEmail || undefined,
      });

      toast({
        title: "Success",
        description: `Sale ${saleToDelete.invoiceNumber} deleted successfully`,
      });

      setDeleteDialogOpen(false);
      setSaleToDelete(null);
    } catch (error: any) {
      console.error("Error deleting sale:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWhatsAppShare = (number: string, saleId: string, amount: number) => {
    const sale = salesData.find((s) => s.id === saleId);
    const text = encodeURIComponent(`Invoice ${saleId} amount $${amount.toFixed(2)} is ${sale?.paymentStatus || "Paid"}. Thank you!`);
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete sale <strong>{saleToDelete?.invoiceNumber}</strong>? 
              This action cannot be undone and will permanently remove this sale from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => {
              setDeleteDialogOpen(false);
              setSaleToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}