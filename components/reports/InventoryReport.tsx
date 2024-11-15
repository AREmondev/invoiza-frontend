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

const inventoryData = [
  {
    id: "1",
    productName: "Product 1",
    currentStock: 150,
    reorderPoint: 50,
    status: "In Stock",
    value: 4500.0,
  },
  {
    id: "2",
    productName: "Product 2",
    currentStock: 25,
    reorderPoint: 30,
    status: "Low Stock",
    value: 1250.0,
  },
];

export function InventoryReport() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Current Stock</TableHead>
            <TableHead>Reorder Point</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventoryData.map((data) => (
            <TableRow key={data.id}>
              <TableCell>{data.productName}</TableCell>
              <TableCell>{data.currentStock}</TableCell>
              <TableCell>{data.reorderPoint}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    data.status === "In Stock" ? "default" : "destructive"
                  }
                >
                  {data.status}
                </Badge>
              </TableCell>
              <TableCell>${data.value.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
