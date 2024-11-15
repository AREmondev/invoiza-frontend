"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewInvoiceForm } from "@/components/invoices/NewInvoiceForm";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { CustomerSelectModal } from "@/components/sales/CustomerSelectModal";

interface Tab {
  id: string;
  title: string;
  type: "list" | "new-invoice";
  customerName?: string;
}

export function TabManager() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "main", title: "Invoices List", type: "list" },
  ]);
  const [activeTab, setActiveTab] = useState("main");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const addNewInvoiceTab = (customerName: string = "") => {
    const newTab = {
      id: `new-invoice-${Date.now()}`,
      title: customerName ? `New Invoice - ${customerName}` : "New Invoice",
      type: "new-invoice" as const,
      customerName,
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const handleAddInvoiceClick = () => {
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
            onClick={handleAddInvoiceClick}
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
                <Button onClick={handleAddInvoiceClick} className="mb-4">
                  Create Invoice
                </Button>
                <InvoiceList />
              </div>
            ) : (
              <NewInvoiceForm initialCustomerName={tab.customerName} />
            )}
          </div>
        ))}
      </div>

      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={(customerName) => {
          addNewInvoiceTab(customerName);
          setIsCustomerModalOpen(false);
        }}
      />
    </div>
  );
}
