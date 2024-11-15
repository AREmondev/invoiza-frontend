"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { useState } from "react";
import { X } from "lucide-react";

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface ItemsTableProps {
  onAddItem: () => void;
  onChange: (total: number) => void;
}

const sampleItems = [
  { value: "1", label: "Item 1", price: 10.99 },
  { value: "2", label: "Item 2", price: 20.99 },
  { value: "3", label: "Item 3", price: 15.99 },
];

export function ItemsTable({ onAddItem, onChange }: ItemsTableProps) {
  const [items, setItems] = useState<Item[]>([]);

  const addNewRow = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: "",
        price: 0,
        quantity: 1,
        total: 0,
      },
    ]);
  };

  const updateItem = (index: number, field: keyof Item, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === "name") {
      const selectedItem = sampleItems.find((item) => item.value === value);
      if (selectedItem) {
        newItems[index].price = selectedItem.price;
      }
    }

    // Recalculate total for the row
    newItems[index].total = newItems[index].price * newItems[index].quantity;

    setItems(newItems);
    // Calculate and emit grand total
    const grandTotal = newItems.reduce((sum, item) => sum + item.total, 0);
    onChange(grandTotal);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    const grandTotal = newItems.reduce((sum, item) => sum + item.total, 0);
    onChange(grandTotal);
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell>
                <SearchableSelect
                  options={sampleItems}
                  value={item.name}
                  onChange={(value) => updateItem(index, "name", value)}
                  placeholder="Select item"
                  onAddNew={onAddItem}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.price}
                  onChange={(e) =>
                    updateItem(index, "price", parseFloat(e.target.value) || 0)
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", parseInt(e.target.value) || 0)
                  }
                />
              </TableCell>
              <TableCell>${item.total.toFixed(2)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button variant="outline" onClick={addNewRow}>
        Add Row
      </Button>
    </div>
  );
}
