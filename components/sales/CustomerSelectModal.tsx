"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customerName: string) => void;
}

const sampleCustomers = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Smith" },
  { id: "3", name: "Bob Johnson" },
];

export function CustomerSelectModal({
  isOpen,
  onClose,
  onSelect,
}: CustomerSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSelect(searchTerm);
      onClose();
    }
  };

  const filteredCustomers = sampleCustomers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Customer</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search or enter customer name"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        {searchTerm && filteredCustomers.length > 0 && (
          <div className="mt-2 space-y-1">
            {filteredCustomers.map((customer) => (
              <Button
                key={customer.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onSelect(customer.name);
                  onClose();
                }}
              >
                {customer.name}
              </Button>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSelect(searchTerm);
              onClose();
            }}
          >
            Add Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
