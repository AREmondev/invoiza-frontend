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
import { MoreHorizontal, Pencil, Trash, FileDown } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const invoices = [
  {
    id: "1",
    invoiceNumber: "INV-001",
    customerName: "John Doe",
    date: new Date("2024-03-15"),
    dueDate: new Date("2024-04-15"),
    amount: 299.99,
    status: "Paid",
  },
  {
    id: "2",
    invoiceNumber: "INV-002",
    customerName: "Jane Smith",
    date: new Date("2024-03-14"),
    dueDate: new Date("2024-04-14"),
    amount: 149.5,
    status: "Pending",
  },
];

export function InvoiceList() {
  const [showInvoice, setShowInvoice] = useState(true);
  const [showCustomer, setShowCustomer] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showDueDate, setShowDueDate] = useState(true);
  const [showAmount, setShowAmount] = useState(true);
  const [showStatus, setShowStatus] = useState(true);

  const [rows, setRows] = useState(invoices);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editable, setEditable] = useState<typeof invoices[number] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const onEdit = (id: string) => {
    const row = rows.find((r) => r.id === id) || null;
    setEditable(row);
    setEditOpen(true);
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
        <Button variant={showInvoice ? "default" : "outline"} size="sm" onClick={() => setShowInvoice((v) => !v)}>Invoice #</Button>
        <Button variant={showCustomer ? "default" : "outline"} size="sm" onClick={() => setShowCustomer((v) => !v)}>Customer</Button>
        <Button variant={showDate ? "default" : "outline"} size="sm" onClick={() => setShowDate((v) => !v)}>Date</Button>
        <Button variant={showDueDate ? "default" : "outline"} size="sm" onClick={() => setShowDueDate((v) => !v)}>Due Date</Button>
        <Button variant={showAmount ? "default" : "outline"} size="sm" onClick={() => setShowAmount((v) => !v)}>Amount</Button>
        <Button variant={showStatus ? "default" : "outline"} size="sm" onClick={() => setShowStatus((v) => !v)}>Status</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {showInvoice && <TableHead>Invoice #</TableHead>}
            {showCustomer && <TableHead>Customer</TableHead>}
            {showDate && <TableHead>Date</TableHead>}
            {showDueDate && <TableHead>Due Date</TableHead>}
            {showAmount && <TableHead>Amount</TableHead>}
            {showStatus && <TableHead>Status</TableHead>}
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((invoice) => (
            <TableRow key={invoice.id}>
              {showInvoice && <TableCell>{invoice.invoiceNumber}</TableCell>}
              {showCustomer && <TableCell>{invoice.customerName}</TableCell>}
              {showDate && <TableCell>{format(invoice.date, "MMM dd, yyyy")}</TableCell>}
              {showDueDate && <TableCell>{format(invoice.dueDate, "MMM dd, yyyy")}</TableCell>}
              {showAmount && <TableCell>৳{invoice.amount.toFixed(2)}</TableCell>}
              {showStatus && (
                <TableCell>
                  <Badge variant={invoice.status === "Paid" ? "default" : "secondary"}>
                    {invoice.status}
                  </Badge>
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
                    <DropdownMenuItem>
                      <FileDown className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(invoice.id)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(invoice.id)}>
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
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          {editable && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Customer</label>
                  <Input value={editable.customerName} onChange={(e) => setEditable({ ...editable!, customerName: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Invoice #</label>
                  <Input value={editable.invoiceNumber} onChange={(e) => setEditable({ ...editable!, invoiceNumber: e.target.value })} />
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
                  <label className="text-sm font-medium">Due Date</label>
                  <Input type="date" value={format(editable.dueDate, "yyyy-MM-dd")} onChange={(e) => setEditable({ ...editable!, dueDate: new Date(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={editable.status} onValueChange={(v) => setEditable({ ...editable!, status: v })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
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
            <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
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
