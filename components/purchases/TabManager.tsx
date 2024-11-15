"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewPurchaseForm } from "@/components/purchases/NewPurchaseForm";
import { PurchasesList } from "@/components/purchases/PurchasesList";
import { CustomerSelectModal } from "@/components/sales/CustomerSelectModal";

interface Tab {
  id: string;
  title: string;
  type: "list" | "new-purchase";
  customerName?: string;
}

export function TabManager() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "main", title: "Purchases List", type: "list" },
  ]);
  const [activeTab, setActiveTab] = useState("main");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  useEffect(() => {
    const handleCreatePurchaseTab = (
      event: CustomEvent<{ customerName: string }>
    ) => {
      const newTab = {
        id: `new-purchase-${Date.now()}`,
        title: event.detail.customerName
          ? `New Purchase - ${event.detail.customerName}`
          : "New Purchase",
        type: "new-purchase" as const,
        customerName: event.detail.customerName,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTab(newTab.id);
    };

    window.addEventListener(
      "create-purchase-tab",
      handleCreatePurchaseTab as EventListener
    );
    return () => {
      window.removeEventListener(
        "create-purchase-tab",
        handleCreatePurchaseTab as EventListener
      );
    };
  }, []);

  const addNewPurchaseTab = (customerName: string = "") => {
    const newTab = {
      id: `new-purchase-${Date.now()}`,
      title: customerName ? `New Purchase - ${customerName}` : "New Purchase",
      type: "new-purchase" as const,
      customerName,
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const handleAddPurchaseClick = () => {
    setIsCustomerModalOpen(true);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);
    if (activeTab === tabId && newTabs.length > 0) {
      setActiveTab(newTabs[newTabs.length - 1].id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b">
        <div className="flex-1 flex items-center">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border-r cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-950 border-b-2 border-b-primary"
                  : "bg-gray-50 dark:bg-gray-900"
              )}
            >
              <span className="text-sm">{tab.title}</span>
              {tab.id !== "main" && (
                <X
                  className="h-4 w-4 hover:text-red-500"
                  onClick={(e) => closeTab(tab.id, e)}
                />
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="ml-2"
            onClick={handleAddPurchaseClick}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn("h-full", activeTab === tab.id ? "block" : "hidden")}
          >
            {tab.type === "list" ? (
              <div>
                <Button onClick={handleAddPurchaseClick} className="mb-4">
                  Add Purchase
                </Button>
                <PurchasesList />
              </div>
            ) : (
              <NewPurchaseForm initialCustomerName={tab.customerName} />
            )}
          </div>
        ))}
      </div>

      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={(customerName) => {
          addNewPurchaseTab(customerName);
          setIsCustomerModalOpen(false);
        }}
      />
    </div>
  );
}
