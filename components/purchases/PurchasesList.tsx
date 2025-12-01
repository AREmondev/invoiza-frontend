"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Invoice } from "@/types/models";

const purchases = [
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
];

interface PurchasesListProps {
  onEditPurchase?: (purchase: Invoice) => void;
}

export function PurchasesList({ onEditPurchase }: PurchasesListProps) {
  const [showPurchaseNumber, setShowPurchaseNumber] = useState(true);
  const [showSupplier, setShowSupplier] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showAmount, setShowAmount] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [showPaymentStatus, setShowPaymentStatus] = useState(true);

  const [rows, setRows] = useState(purchases);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editable, setEditable] = useState<typeof purchases[number] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const onEdit = (id: string) => {
    const row = rows.find((r) => r.id === id) || null;
    if (onEditPurchase && row) {
      // Convert the mock data to PurchaseInvoice format
      const purchaseInvoice: Invoice = {
        id: row.id,
        supplierId: row.supplierName,
        invoiceNumber: row.purchaseNumber,
        type: "purchase",
        invoiceDate: row.date,
        status: row.status.toLowerCase() as any,
        paymentStatus: row.paymentStatus.toLowerCase() as any,
        paymentMethod: "cash",
        lineItems: [],
        additionalCharges: [],
        payments: [],
        returns: [],
        auditLogs: [],
        subtotalCents: row.amount * 100,
        discountCents: 0,
        discountType: "percentage",
        discountValue: 0,
        additionalChargesCents: 0,
        taxCents: 0,
        totalCents: row.amount * 100,
        paidCents: 0,
        dueCents: row.amount * 100,
        isLocked: false,
        createdAt: row.date,
        updatedAt: new Date(),
        createdBy: "system",
        updatedBy: "system",
      };
      onEditPurchase(purchaseInvoice);
    } else {
      setEditable(row);
      setEditOpen(true);
    }
  };

  const onDelete = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const saveEdit = () => {
    if (!editable) return;
    setRows((prev) => prev.map((r) => (r.id === editable.id ? { ...editable } : r)));
    setEditOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setRows((prev) => prev.filter((r) => r.id !== deleteId));
    setDeleteOpen(false);
    setDeleteId(null);
  };

  return (
    <div className="rounded-md border">
      <div className="flex gap-2 p-3 items-center border-b">
        <span className="text-sm font-medium">Columns:</span>
        <Button variant={showPurchaseNumber ? "default" : "outline"} size="sm" onClick={() => setShowPurchaseNumber((v) => !v)}>Purchase #</Button>
        <Button variant={showSupplier ? "default" : "outline"} size="sm" onClick={() => setShowSupplier((v) => !v)}>Supplier</Button>
        <Button variant={showDate ? "default" : "outline"} size="sm" onClick={() => setShowDate((v) => !v)}>Date</Button>
        <Button variant={showAmount ? "default" : "outline"} size="sm" onClick={() => setShowAmount((v) => !v)}>Amount</Button>
        <Button variant={showStatus ? "default" : "outline"} size="sm" onClick={() => setShowStatus((v) => !v)}>Status</Button>
        <Button variant={showPaymentStatus ? "default" : "outline"} size="sm" onClick={() => setShowPaymentStatus((v) => !v)}>Payment Status</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {showPurchaseNumber && <TableHead>Purchase #</TableHead>}
            {showSupplier && <TableHead>Supplier</TableHead>}
            {showDate && <TableHead>Date</TableHead>}
            {showAmount && <TableHead>Amount</TableHead>}
            {showStatus && <TableHead>Status</TableHead>}
            {showPaymentStatus && <TableHead>Payment Status</TableHead>}
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((purchase) => (
            <TableRow key={purchase.id}>
              {showPurchaseNumber && <TableCell>{purchase.purchaseNumber}</TableCell>}
              {showSupplier && <TableCell>{purchase.supplierName}</TableCell>}
              {showDate && <TableCell>{format(purchase.date, "MMM dd, yyyy")}</TableCell>}
              {showAmount && <TableCell>৳{purchase.amount.toFixed(2)}</TableCell>}
              {showStatus && (
                <TableCell>
                  <Badge variant={purchase.status === "Received" ? "default" : "secondary"}>{purchase.status}</Badge>
                </TableCell>
              )}
              {showPaymentStatus && (
                <TableCell>
                  <Badge variant={purchase.paymentStatus === "Paid" ? "default" : "destructive"}>{purchase.paymentStatus}</Badge>
                </TableCell>
              )}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(purchase.id)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(purchase.id)}>
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
          </DialogHeader>
          {editable && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Supplier</label>
                  <Input value={editable.supplierName} onChange={(e) => setEditable({ ...editable!, supplierName: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Purchase #</label>
                  <Input value={editable.purchaseNumber} onChange={(e) => setEditable({ ...editable!, purchaseNumber: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input type="number" min={0} step="0.01" value={editable.amount} onChange={(e) => setEditable({ ...editable!, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={format(editable.date, "yyyy-MM-dd")} onChange={(e) => setEditable({ ...editable!, date: new Date(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={editable.status} onValueChange={(v) => setEditable({ ...editable!, status: v })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Received">Received</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select value={editable.paymentStatus} onValueChange={(v) => setEditable({ ...editable!, paymentStatus: v })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this purchase?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
