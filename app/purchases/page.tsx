"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedPurchaseForm } from "@/components/purchases/EnhancedPurchaseForm";
import { PurchasesList } from "@/components/purchases/PurchasesList";
import { PurchasesListAdvanced } from "@/components/purchases/purchases-list-advanced";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import type { Invoice } from "@/types/models";

export default function PurchasesPage() {
  const [activeTab, setActiveTab] = useState("new");
  const [editingPurchase, setEditingPurchase] = useState<Invoice | undefined>();
  const [useAdvancedTable, setUseAdvancedTable] = useState(true);

  const handleSavePurchase = (purchase: Invoice) => {
    console.log("Saving purchase:", purchase);
    // Here you would typically save to your backend
    // For now, we'll just log and switch to the list view
    setActiveTab("list");
    setEditingPurchase(undefined);
  };

  const handleEditPurchase = (purchase: Invoice) => {
    setEditingPurchase(purchase);
    setActiveTab("new");
  };

  const handleCancelEdit = () => {
    setEditingPurchase(undefined);
    setActiveTab("list");
  };

  return (
    <div className="p-6 h-[calc(100vh-65px)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchases</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseAdvancedTable(!useAdvancedTable)}
        >
          <Settings className="h-4 w-4 mr-2" />
          {useAdvancedTable ? "Use Basic Table" : "Use Advanced Table"}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="new">
            {editingPurchase ? "Edit Purchase" : "New Purchase"}
          </TabsTrigger>
          <TabsTrigger value="list">Purchase List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new">
          <EnhancedPurchaseForm
            initialData={editingPurchase}
            onSave={handleSavePurchase}
            onCancel={editingPurchase ? handleCancelEdit : undefined}
          />
        </TabsContent>
        
        <TabsContent value="list">
          {useAdvancedTable ? (
            <PurchasesListAdvanced 
              onEditPurchase={handleEditPurchase} 
              userId="current-user"
            />
          ) : (
            <PurchasesList onEditPurchase={handleEditPurchase} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
