"use client";

import { useState, useEffect } from 'react';
import { Trash2, DollarSign, Info, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductSelector } from './ProductSelector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProductStore } from '@/store/useProductStore';
import { PriceQuantityHistory } from './PriceQuantityHistory';
import { Product, InvoiceLineItem } from '@/types';
import { cn } from '@/lib/utils';

interface LineEditorProps {
  lineItem: InvoiceLineItem;
  index: number;
  customerId?: string;
  onUpdate: (index: number, updates: Partial<InvoiceLineItem>) => void;
  onRemove: (index: number) => void;
  onShowProductDetails?: (product: Product | null) => void;
  totalLineItems?: number;
  className?: string;
}

export function LineEditor({ 
  lineItem, 
  index, 
  customerId,
  onUpdate, 
  onRemove,
  onShowProductDetails,
  totalLineItems = 1,
  className 
}: LineEditorProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);
  const { products, getCustomerPriceHistory } = useProductStore();

  // Load product when productId changes
  useEffect(() => {
    if (lineItem.productId) {
      const product = products.find(p => p.id === lineItem.productId);
      if (product) {
        setSelectedProduct(product);
      }
    } else {
      setSelectedProduct(null);
    }
  }, [lineItem.productId, products]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    const baseUnit = product.baseUnit;
    const baseUnitObj = product.units.find(u => u.unit === baseUnit || u.isBaseUnit) || product.units[0];
    
    onUpdate(index, {
      productId: product.id,
      unit: baseUnit,
      unitPriceCents: baseUnitObj?.price || 0,
      totalPriceCents: (baseUnitObj?.price || 0) * lineItem.quantity,
    });

    // Show product details offcanvas when product is selected
    if (onShowProductDetails) {
      onShowProductDetails(product);
    }
  };

  const handleQuantityChange = (quantity: number) => {
    const clampedQuantity = Math.max(1, Math.floor(quantity || 1));
    const totalPriceCents = lineItem.unitPriceCents * clampedQuantity;
    
    onUpdate(index, {
      quantity: clampedQuantity,
      totalPriceCents,
    });
  };

  const handlePriceChange = (price: number) => {
    const unitPriceCents = Math.max(0, price || 0);
    const totalPriceCents = unitPriceCents * lineItem.quantity;
    
    onUpdate(index, {
      unitPriceCents,
      totalPriceCents,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  };

  // Calculate total for this line
  const lineTotal = lineItem.unitPriceCents * lineItem.quantity;

  return (
    <div className={cn("flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-accent/50 transition-colors", className)}>
      {/* Product Selector */}
      <div className="flex-1 min-w-[200px] relative">
        <ProductSelector
          onProductSelect={handleProductSelect}
          selectedProductId={lineItem.productId}
          customerId={customerId}
        />
        {selectedProduct && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onShowProductDetails?.(selectedProduct)}
            className="absolute right-1 top-1 h-6 w-6 p-0"
            title="View Product Details"
          >
            <Info className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Quantity */}
      <div className="w-32">
        <div className="relative">
          <Input
            type="number"
            min="1"
            step="1"
            value={Math.floor(lineItem.quantity) || ''}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="text-right pr-12"
            placeholder="Qty"
          />
          <span className="absolute right-2 top-2.5 text-xs text-muted-foreground pointer-events-none">
            pcs
          </span>
        </div>
      </div>

      {/* Unit Price with History */}
      <div className="w-32">
        <Popover open={priceHistoryOpen} onOpenChange={setPriceHistoryOpen}>
          <PopoverTrigger asChild>
            <div className="relative cursor-pointer">
              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={(lineItem.unitPriceCents / 100).toFixed(2)}
                onChange={(e) => handlePriceChange(parseFloat(e.target.value) * 100 || 0)}
                onClick={() => {
                  if (selectedProduct && customerId) {
                    setPriceHistoryOpen(true);
                  }
                }}
                className="pl-8 text-right cursor-pointer"
                placeholder="0.00"
              />
            </div>
          </PopoverTrigger>
          {selectedProduct && customerId && (
            <PopoverContent className="w-[450px] p-0" align="start">
              <PriceQuantityHistory
                productId={selectedProduct.id}
                variationId={lineItem.variationId}
                customerId={customerId}
                currentPrice={lineItem.unitPriceCents}
                currentQuantity={lineItem.quantity}
                unit={lineItem.unit}
                onPriceSelect={(price: number) => {
                  handlePriceChange(price);
                  setPriceHistoryOpen(false);
                }}
                onQuantitySelect={(quantity: number) => {
                  handleQuantityChange(quantity);
                  setPriceHistoryOpen(false);
                }}
              />
            </PopoverContent>
          )}
        </Popover>
      </div>

      {/* Total Price (calculated, read-only) */}
      <div className="w-32 text-right font-semibold text-lg">
        {formatCurrency(lineTotal)}
      </div>

      {/* Delete Button */}
      <div className="w-10 flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={totalLineItems <= 1}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
