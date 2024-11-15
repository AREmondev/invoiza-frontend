"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { ItemsTable } from "@/components/sales/ItemsTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSaleStore } from "@/store/useSaleStore";

const sampleCustomers = [
  { value: "1", label: "John Doe" },
  { value: "2", label: "Jane Smith" },
  { value: "3", label: "Bob Johnson" },
];

interface NewSaleFormProps {
  tabId: string;
  initialCustomerName?: string;
}

export function NewSaleForm({
  tabId,
  initialCustomerName = "",
}: NewSaleFormProps) {
  const [customerId, setCustomerId] = useState<string>("");
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const { updateCustomerName, updateDiscount, updateTotal } = useSaleStore();

  useEffect(() => {
    if (initialCustomerName) {
      updateCustomerName(tabId, initialCustomerName);
    }
  }, [initialCustomerName, tabId]);

  const handleCustomerChange = (value: string) => {
    setCustomerId(value);
    const customer = sampleCustomers.find((c) => c.value === value);
    if (customer) {
      updateCustomerName(tabId, customer.label);
    }
  };

  const handleDiscountChange = (value: string) => {
    const discount = parseFloat(value) || 0;
    updateDiscount(tabId, discount);
  };

  const handleTotalChange = (total: number) => {
    updateTotal(tabId, total);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="customer">Customer</Label>
          <SearchableSelect
            options={sampleCustomers}
            value={customerId}
            onChange={handleCustomerChange}
            placeholder="Select customer"
            onAddNew={() => {
              window.dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: "c",
                  metaKey: true,
                  bubbles: true,
                })
              );
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Items</Label>
          <ItemsTable
            onAddItem={() => setIsAddItemModalOpen(true)}
            onChange={handleTotalChange}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Discount (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              onChange={(e) => handleDiscountChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold space-y-1">
            <div>
              Subtotal: $
              {useSaleStore(
                (state) => state.saleTabs[tabId]?.total || 0
              ).toFixed(2)}
            </div>
            <div>
              Discount:{" "}
              {useSaleStore((state) => state.saleTabs[tabId]?.discount || 0)}%
            </div>
            <div>
              Total: $
              {useSaleStore((state) => {
                const tab = state.saleTabs[tabId];
                if (!tab) return "0.00";
                const discountedTotal = tab.total * (1 - tab.discount / 100);
                return discountedTotal.toFixed(2);
              })}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Clear</Button>
            <Button>Save Sale</Button>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input />
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input type="number" />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAddItemModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setIsAddItemModalOpen(false)}>
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
