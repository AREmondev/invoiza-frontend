"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const purchaseData = [
  {
    id: "1",
    date: new Date("2024-03-15"),
    totalPurchases: 5500.0,
    numberOfOrders: 5,
    averageOrderValue: 1100.0,
  },
  {
    id: "2",
    date: new Date("2024-03-14"),
    totalPurchases: 3200.0,
    numberOfOrders: 3,
    averageOrderValue: 1066.67,
  },
];

export function PurchaseReport() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Total Purchases</TableHead>
            <TableHead>Number of Orders</TableHead>
            <TableHead>Average Order Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseData.map((data) => (
            <TableRow key={data.id}>
              <TableCell>{format(data.date, "MMM dd, yyyy")}</TableCell>
              <TableCell>${data.totalPurchases.toFixed(2)}</TableCell>
              <TableCell>{data.numberOfOrders}</TableCell>
              <TableCell>${data.averageOrderValue.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
