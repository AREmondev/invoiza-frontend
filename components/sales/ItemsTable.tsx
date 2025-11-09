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
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  unit?: "pcs" | "box";
}

interface ItemsTableProps {
  onAddItem: () => void;
  onChange: (total: number) => void;
  additionalCharge?: number; // distribute across quantities
}

const sampleItems = [
  { value: "1", label: "Item 1", price: 10.99, category: "Grocery", boxSize: 12 },
  { value: "2", label: "Item 2", price: 20.99, category: "Electronics", boxSize: 1 },
  { value: "3", label: "Item 3", price: 15.99, category: "Grocery", boxSize: 6 },
];

export function ItemsTable({ onAddItem, onChange, additionalCharge = 0 }: ItemsTableProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [showPrice, setShowPrice] = useState(true);
  const [showQuantity, setShowQuantity] = useState(true);
  const [showTotal, setShowTotal] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const totalQuantity = useMemo(
    () => items.reduce((sum, it) => sum + effectiveQuantity(it), 0),
    [items]
  );
  const perUnitExtra = totalQuantity > 0 ? additionalCharge / totalQuantity : 0;

  function effectiveQuantity(it: Item) {
    const selected = sampleItems.find((s) => s.label === it.name);
    const boxSize = selected?.boxSize || 1;
    const unitFactor = it.unit === "box" ? boxSize : 1;
    return (it.quantity || 0) * unitFactor;
  }

  useEffect(() => {
    // Recompute grand total when additionalCharge changes
    const newItems = items.map((it) => ({
      ...it,
      total: it.price * effectiveQuantity(it) + perUnitExtra * effectiveQuantity(it),
    }));
    setItems(newItems);
    const grandTotal = newItems.reduce((sum, item) => sum + item.total, 0);
    onChange(grandTotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [additionalCharge]);

  const addNewRow = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: "",
        price: 0,
        quantity: 1,
        total: 0,
        unit: "pcs",
      },
    ]);
  };

  const updateItem = (index: number, field: keyof Item, value: any) => {
    const newItems = [...items];
    if (field === "quantity") {
      const q = parseInt(value as string) || 1;
      newItems[index].quantity = q < 1 ? 1 : q; // prevent zero quantity
    } else if (field === "price") {
      const p = parseFloat(value as string) || 0;
      newItems[index].price = p;
    } else if (field === "name") {
      newItems[index].name = value as string;
    } else if (field === "unit") {
      newItems[index].unit = value as Item["unit"];
    } else {
      (newItems[index] as any)[field] = value;
    }

    if (field === "name") {
      const selectedItem = sampleItems.find((item) => item.value === value || item.label === value);
      if (selectedItem) {
        newItems[index].price = selectedItem.price;
        // default unit to pcs for non-box items
        newItems[index].unit = selectedItem.boxSize > 1 ? newItems[index].unit || "pcs" : "pcs";
      }
    }

    // Recalculate total for the row including diluted additional charge with unit conversion
    const eq = effectiveQuantity(newItems[index]);
    newItems[index].total = newItems[index].price * eq + perUnitExtra * eq;

    setItems(newItems);
    const grandTotal = newItems.reduce((sum, item) => sum + item.total, 0);
    onChange(grandTotal);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    const grandTotal = newItems.reduce((sum, item) => sum + item.total, 0);
    onChange(grandTotal);
  };

  const filteredOptions = sampleItems.filter((opt) => categoryFilter === "All" || opt.category === categoryFilter);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <span className="text-sm font-medium">Columns:</span>
        <Button variant={showPrice ? "default" : "outline"} size="sm" onClick={() => setShowPrice((v) => !v)}>
          Price
        </Button>
        <Button variant={showQuantity ? "default" : "outline"} size="sm" onClick={() => setShowQuantity((v) => !v)}>
          Quantity
        </Button>
        <Button variant={showTotal ? "default" : "outline"} size="sm" onClick={() => setShowTotal((v) => !v)}>
          Total
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm">Category:</span>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Grocery">Grocery</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            {showPrice && <TableHead>Price</TableHead>}
            {showQuantity && <TableHead>Quantity</TableHead>}
            <TableHead>Unit</TableHead>
            {showTotal && <TableHead>Total</TableHead>}
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell>
                <SearchableSelect
                  options={filteredOptions.map((o) => ({ value: o.value, label: o.label }))}
                  value={item.name}
                  onChange={(value) => updateItem(index, "name", value)}
                  placeholder="Select item"
                  onAddNew={onAddItem}
                />
              </TableCell>
              {showPrice && (
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", e.target.value)}
                  />
                </TableCell>
              )}
              {showQuantity && (
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  />
                </TableCell>
              )}
              <TableCell>
                <Select value={item.unit} onValueChange={(v) => updateItem(index, "unit", v)}>
                  <SelectTrigger className="w-[120px]"><SelectValue placeholder="pcs" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">pcs</SelectItem>
                    <SelectItem value="box">box</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              {showTotal && <TableCell>৳{item.total.toFixed(2)}</TableCell>}
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
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
