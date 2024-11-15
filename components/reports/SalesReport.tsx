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

const salesData = [
  {
    id: "1",
    date: new Date("2024-03-15"),
    totalSales: 2500.0,
    numberOfOrders: 12,
    averageOrderValue: 208.33,
  },
  {
    id: "2",
    date: new Date("2024-03-14"),
    totalSales: 1800.0,
    numberOfOrders: 8,
    averageOrderValue: 225.0,
  },
];

export function SalesReport() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Total Sales</TableHead>
            <TableHead>Number of Orders</TableHead>
            <TableHead>Average Order Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {salesData.map((data) => (
            <TableRow key={data.id}>
              <TableCell>{format(data.date, "MMM dd, yyyy")}</TableCell>
              <TableCell>${data.totalSales.toFixed(2)}</TableCell>
              <TableCell>{data.numberOfOrders}</TableCell>
              <TableCell>${data.averageOrderValue.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
