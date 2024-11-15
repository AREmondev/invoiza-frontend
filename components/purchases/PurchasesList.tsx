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

export function PurchasesList() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Purchase #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell>{purchase.purchaseNumber}</TableCell>
              <TableCell>{purchase.supplierName}</TableCell>
              <TableCell>{format(purchase.date, "MMM dd, yyyy")}</TableCell>
              <TableCell>${purchase.amount.toFixed(2)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    purchase.status === "Received" ? "default" : "secondary"
                  }
                >
                  {purchase.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    purchase.paymentStatus === "Paid"
                      ? "default"
                      : "destructive"
                  }
                >
                  {purchase.paymentStatus}
                </Badge>
              </TableCell>
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
