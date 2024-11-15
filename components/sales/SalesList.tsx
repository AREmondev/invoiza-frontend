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

const sales = [
  {
    id: "1",
    invoiceNumber: "INV-001",
    customerName: "John Doe",
    date: new Date("2024-03-15"),
    amount: 299.99,
    paymentStatus: "Paid",
    paymentMethod: "Credit Card",
  },
  {
    id: "2",
    invoiceNumber: "INV-002",
    customerName: "Jane Smith",
    date: new Date("2024-03-14"),
    amount: 149.5,
    paymentStatus: "Pending",
    paymentMethod: "Bank Transfer",
  },
];

export function SalesList() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>{sale.invoiceNumber}</TableCell>
              <TableCell>{sale.customerName}</TableCell>
              <TableCell>{format(sale.date, "MMM dd, yyyy")}</TableCell>
              <TableCell>${sale.amount.toFixed(2)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    sale.paymentStatus === "Paid" ? "default" : "secondary"
                  }
                >
                  {sale.paymentStatus}
                </Badge>
              </TableCell>
              <TableCell>{sale.paymentMethod}</TableCell>
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
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
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
    </div>
  );
}
