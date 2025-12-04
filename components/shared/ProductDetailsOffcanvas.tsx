"use client";

import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ProductDetailsPanel } from './ProductDetailsPanel';
import { Product, ProductVariation, ProductUnit } from '@/types';

interface ProductDetailsOffcanvasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  variation?: ProductVariation;
  unit?: ProductUnit;
  customerId?: string;
}

export function ProductDetailsOffcanvas({
  open,
  onOpenChange,
  product,
  variation,
  unit,
  customerId,
}: ProductDetailsOffcanvasProps) {
  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <span className="text-xl font-bold">Product Details</span>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </SheetTitle>
        </SheetHeader>
        <div className="h-[calc(100vh-80px)]">
          <ProductDetailsPanel
            product={product}
            variation={variation}
            unit={unit}
            customerId={customerId}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

