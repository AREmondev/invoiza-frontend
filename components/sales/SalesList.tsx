"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const mockSales = [
  { id: "INV-001", customer: "John Doe", date: "2024-10-01", amount: 250.0, paymentStatus: "Paid", paymentMethod: "Cash", whatsapp: "+1234567890" },
  { id: "INV-002", customer: "Jane Smith", date: "2024-10-02", amount: 150.5, paymentStatus: "Due", paymentMethod: "Bank", whatsapp: "+1987654321" },
  { id: "INV-003", customer: "Acme Corp", date: "2024-10-03", amount: 320.0, paymentStatus: "Partial", paymentMethod: "Mobile Banking", whatsapp: "+1122334455" },
];

export function SalesList() {
  const [columns, setColumns] = useState({
    invoice: true,
    customer: true,
    date: true,
    amount: true,
    paymentStatus: true,
    paymentMethod: true,
  });

  const [search, setSearch] = useState("");
  const [sales, setSales] = useState(mockSales);
  const filtered = sales.filter(
    (s) => s.customer.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())
  );

  const whatsappShare = (number: string, saleId: string, amount: number) => {
    const text = encodeURIComponent(`Invoice ${saleId} amount ${amount} is ${filtered.find((s) => s.id === saleId)?.paymentStatus || "Paid"}. Thank you!`);
    const url = `https://wa.me/${number}?text=${text}`;
    window.open(url, "_blank");
  };

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editable, setEditable] = useState<typeof mockSales[number] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const onEdit = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId) || null;
    setEditable(sale);
    setEditOpen(true);
  };
  
  const onDelete = (saleId: string) => {
    setDeleteId(saleId);
    setDeleteOpen(true);
  };
  
  const saveEdit = () => {
    if (!editable) return;
    setSales((prev) => prev.map((s) => (s.id === editable.id ? { ...editable } : s)));
    setEditOpen(false);
  };
  
  const confirmDelete = () => {
    if (!deleteId) return;
    setSales((prev) => prev.filter((s) => s.id !== deleteId));
    setDeleteOpen(false);
    setDeleteId(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Columns:</span>
        <Button variant={columns.invoice ? "default" : "outline"} size="sm" onClick={() => setColumns({ ...columns, invoice: !columns.invoice })}>
          Invoice #
        </Button>
        <Button variant={columns.customer ? "default" : "outline"} size="sm" onClick={() => setColumns({ ...columns, customer: !columns.customer })}>
          Customer
        </Button>
        <Button variant={columns.date ? "default" : "outline"} size="sm" onClick={() => setColumns({ ...columns, date: !columns.date })}>
          Date
        </Button>
        <Button variant={columns.amount ? "default" : "outline"} size="sm" onClick={() => setColumns({ ...columns, amount: !columns.amount })}>
          Amount
        </Button>
        <Button
          variant={columns.paymentStatus ? "default" : "outline"}
          size="sm"
          onClick={() => setColumns({ ...columns, paymentStatus: !columns.paymentStatus })}
        >
          Payment Status
        </Button>
        <Button
          variant={columns.paymentMethod ? "default" : "outline"}
          size="sm"
          onClick={() => setColumns({ ...columns, paymentMethod: !columns.paymentMethod })}
        >
          Payment Method
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Input placeholder="Search by customer or invoice" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.invoice && <TableHead>Invoice #</TableHead>}
            {columns.customer && <TableHead>Customer</TableHead>}
            {columns.date && <TableHead>Date</TableHead>}
            {columns.amount && <TableHead>Amount</TableHead>}
            {columns.paymentStatus && <TableHead>Payment Status</TableHead>}
            {columns.paymentMethod && <TableHead>Payment Method</TableHead>}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((sale) => (
            <TableRow key={sale.id}>
              {columns.invoice && <TableCell>{sale.id}</TableCell>}
              {columns.customer && <TableCell>{sale.customer}</TableCell>}
              {columns.date && <TableCell>{sale.date}</TableCell>}
              {columns.amount && <TableCell>৳{sale.amount.toFixed(2)}</TableCell>}
              {columns.paymentStatus && (
                <TableCell>
                  <Badge variant={sale.paymentStatus === "Paid" ? "default" : sale.paymentStatus === "Partial" ? "secondary" : "destructive"}>
                    {sale.paymentStatus}
                  </Badge>
                </TableCell>
              )}
              {columns.paymentMethod && <TableCell>{sale.paymentMethod}</TableCell>}
              <TableCell className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(sale.id)}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(sale.id)}>Delete</Button>
                <Button variant="default" size="sm" onClick={() => whatsappShare(sale.whatsapp, sale.id, sale.amount)}>WhatsApp</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
          </DialogHeader>
          {editable && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Customer</label>
                  <Input value={editable.customer} onChange={(e) => setEditable({ ...editable!, customer: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input value={editable.date} onChange={(e) => setEditable({ ...editable!, date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input type="number" min={0} step="0.01" value={editable.amount} onChange={(e) => setEditable({ ...editable!, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-sm font-medium">WhatsApp</label>
                  <Input value={editable.whatsapp} onChange={(e) => setEditable({ ...editable!, whatsapp: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select value={editable.paymentStatus} onValueChange={(v) => setEditable({ ...editable!, paymentStatus: v })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Due">Due</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select value={editable.paymentMethod} onValueChange={(v) => setEditable({ ...editable!, paymentMethod: v })}>
                    <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank">Bank</SelectItem>
                      <SelectItem value="Mobile Banking">Mobile Banking</SelectItem>
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
            <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
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
