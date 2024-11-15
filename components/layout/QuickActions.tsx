"use client";

import { Button } from "@/components/ui/button";
import { CustomerSelectModal } from "@/components/sales/CustomerSelectModal";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";

// Add this type for our global event
declare global {
  interface WindowEventMap {
    "create-sale-tab": CustomEvent<{ customerName: string }>;
    "create-purchase-tab": CustomEvent<{ customerName: string }>;
  }
}

export function QuickActions() {
  const router = useRouter();
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"sale" | "purchase" | null>(
    null
  );

  const handleCustomerSelect = (customerName: string) => {
    if (actionType === "sale") {
      // First navigate to sales page
      router.push("/sales");
      // Then dispatch event to create new tab
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("create-sale-tab", {
            detail: { customerName },
          })
        );
      }, 100);
    } else if (actionType === "purchase") {
      router.push("/purchases");
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("create-purchase-tab", {
            detail: { customerName },
          })
        );
      }, 100);
    }
    setIsCustomerModalOpen(false);
    setActionType(null);
  };

  const handleAddCustomer = () => {
    // Just trigger the keyboard shortcut to open the global customer modal
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "c",
        metaKey: true,
        bubbles: true,
      })
    );
  };

  const handleAddSale = () => {
    router.push("/sales");
    setTimeout(() => {
      setActionType("sale");
      setIsCustomerModalOpen(true);
    }, 100);
  };

  const handleAddPurchase = () => {
    router.push("/purchases");
    setTimeout(() => {
      setActionType("purchase");
      setIsCustomerModalOpen(true);
    }, 100);
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if Command (Mac) or Control (Windows) is pressed
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault(); // Prevent default save behavior
            handleAddSale();
            break;
          case "p":
            e.preventDefault(); // Prevent default print behavior
            handleAddPurchase();
            break;
          case "c":
            e.preventDefault(); // Prevent default copy behavior
            handleAddCustomer();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="bg-blue-600 hover:bg-blue-700" // Blue for sales
        onClick={handleAddSale}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Sale (⌘S)
      </Button>
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700" // Green for purchases
        onClick={handleAddPurchase}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Purchase (⌘P)
      </Button>
      <Button
        size="sm"
        className="bg-purple-600 hover:bg-purple-700" // Purple for customers
        onClick={handleAddCustomer}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Customer (⌘C)
      </Button>

      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setActionType(null);
        }}
        onSelect={handleCustomerSelect}
      />
    </div>
  );
}
