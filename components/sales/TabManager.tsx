"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewSaleForm } from "@/components/sales/NewSaleForm";
import { SalesList } from "@/components/sales/SalesList";
import { CustomerSelectModal } from "@/components/sales/CustomerSelectModal";
import { useSaleStore } from "@/store/useSaleStore";

interface Tab {
  id: string;
  title: string;
  type: "list" | "new-sale";
  customerName?: string;
}

export function TabManager() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "main", title: "Sales List", type: "list" },
  ]);
  const [activeTab, setActiveTab] = useState("main");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const { addSaleTab, removeSaleTab, saleTabs } = useSaleStore();

  useEffect(() => {
    const handleCreateSaleTab = (
      event: CustomEvent<{ customerName: string }>
    ) => {
      const newTab = {
        id: `new-sale-${Date.now()}`,
        title: event.detail.customerName
          ? `New Sale - ${event.detail.customerName}`
          : "New Sale",
        type: "new-sale" as const,
        customerName: event.detail.customerName,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTab(newTab.id);
    };

    window.addEventListener(
      "create-sale-tab",
      handleCreateSaleTab as EventListener
    );
    return () => {
      window.removeEventListener(
        "create-sale-tab",
        handleCreateSaleTab as EventListener
      );
    };
  }, []);

  const addNewSaleTab = (customerName: string = "") => {
    const newTabId = `new-sale-${Date.now()}`;
    const newTab = {
      id: newTabId,
      title: customerName ? `New Sale - ${customerName}` : "New Sale",
      type: "new-sale" as const,
      customerName,
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTabId);
    addSaleTab(newTabId, customerName);
  };

  const handleAddSaleClick = () => {
    setIsCustomerModalOpen(true);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);
    if (activeTab === tabId && newTabs.length > 0) {
      setActiveTab(newTabs[newTabs.length - 1].id);
    }
    removeSaleTab(tabId);
  };

  useEffect(() => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.type === "new-sale" && saleTabs[tab.id]) {
          return {
            ...tab,
            title: saleTabs[tab.id].customerName
              ? `New Sale - ${saleTabs[tab.id].customerName}`
              : "New Sale",
          };
        }
        return tab;
      })
    );
  }, [saleTabs]);

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
            onClick={handleAddSaleClick}
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
                <Button onClick={handleAddSaleClick} className="mb-4">
                  Add Sale
                </Button>
                <SalesList />
              </div>
            ) : (
              <NewSaleForm initialCustomerName={tab.customerName} />
            )}
          </div>
        ))}
      </div>

      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={(customerName) => {
          addNewSaleTab(customerName);
          setIsCustomerModalOpen(false);
        }}
      />
    </div>
  );
}
