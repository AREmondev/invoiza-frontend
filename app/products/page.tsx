"use client";

import { useState } from 'react';
import { ProductListWithAdvancedTable } from '@/components/products/product-list-advanced';
import { AddProductModal } from '@/components/products/add-product-modal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ProductsPage() {
  // For demo purposes, using a mock user ID. In a real app, this would come from authentication
  const [userId] = useState("user-123");
  const [addProductOpen, setAddProductOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your pharmacy products and inventory
          </p>
        </div>
        <Button onClick={() => setAddProductOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      <ProductListWithAdvancedTable userId={userId} />
      <AddProductModal open={addProductOpen} onOpenChange={setAddProductOpen} />
    </div>
  );
}
