"use client";

import { useState, useEffect } from 'react';
import { Trash2, Plus, DollarSign, Package, Percent, Calculator, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProductStore } from '@/store/useProductStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ProductSelector } from './ProductSelector';
import { PriceHistoryPopover } from './PriceHistoryPopover';
import { ChargesSelector } from './ChargesSelector';
import { AgreementWarning } from './AgreementWarning';
import { ProductDetailsPanel } from './ProductDetailsPanel';
import { Product, ProductVariation, ProductUnit, InvoiceLineItem, AppliedAdditionalCharge } from '@/types';
import { cn } from '@/lib/utils';

interface LineEditorProps {
  lineItem: InvoiceLineItem;
  index: number;
  customerId?: string;
  onUpdate: (index: number, updates: Partial<InvoiceLineItem>) => void;
  onRemove: (index: number) => void;
  className?: string;
}

export function LineEditor({ 
  lineItem, 
  index, 
  customerId,
  onUpdate, 
  onRemove,
  className 
}: LineEditorProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null);
  const [showAgreementWarning, setShowAgreementWarning] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(true); // Auto-show by default
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);
  
  const { products, checkPriceAgreement, getCustomerPriceHistory } = useProductStore();
  const { activeAdditionalCharges } = useSettingsStore();
  
  // Load product details when line item changes
  useEffect(() => {
    if (lineItem.productId) {
      const product = products.find(p => p.id === lineItem.productId);
      if (product) {
        setSelectedProduct(product);
        
        if (lineItem.variationId) {
          const variation = product.variations.find(v => v.id === lineItem.variationId);
          setSelectedVariation(variation || null);
        }
        
        const unit = product.units.find(u => u.unit === lineItem.unit);
        setSelectedUnit(unit || null);
        
        // Auto-show product details when product is selected
        if (product) {
          setShowProductDetails(true);
        }
      }
    } else {
      setSelectedProduct(null);
      setSelectedVariation(null);
      setSelectedUnit(null);
      setShowProductDetails(false);
    }
  }, [lineItem.productId, lineItem.variationId, lineItem.unit, products]);

  // Check price agreements when price changes
  useEffect(() => {
    if (customerId && selectedProduct && selectedUnit) {
      const agreementCheck = checkPriceAgreement(
        selectedProduct.id,
        lineItem.unitPriceCents,
        lineItem.quantity,
        selectedUnit.unit,
        customerId,
        lineItem.variationId
      );
      
      setShowAgreementWarning(!agreementCheck.isCompliant);
    }
  }, [lineItem.unitPriceCents, lineItem.quantity, lineItem.variationId, customerId, selectedProduct, selectedUnit, checkPriceAgreement]);

  const handleProductSelect = (product: Product, variation?: ProductVariation, unit?: ProductUnit) => {
    setSelectedProduct(product);
    setSelectedVariation(variation || null);
    setSelectedUnit(unit || null);
    
    const updates: Partial<InvoiceLineItem> = {
      productId: product.id,
      variationId: variation?.id,
      unit: unit?.unit || product.baseUnit,
      unitPriceCents: unit?.price || 0,
      totalPriceCents: (unit?.price || 0) * lineItem.quantity,
    };
    
    onUpdate(index, updates);
  };

  const handleQuantityChange = (quantity: number) => {
    const clampedQuantity = Math.max(1, quantity || 1);
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
      originalPriceCents: unitPriceCents, // Store original entered price
    });
  };

  const handleDiscountChange = (discount: number) => {
    const discountCents = Math.max(0, discount || 0);
    
    onUpdate(index, {
      discountCents,
    });
  };

  const handlePriceHistorySelect = (price: number) => {
    handlePriceChange(price);
    setShowPriceHistory(false);
  };

  const calculateLineTotal = () => {
    const subtotal = lineItem.unitPriceCents * lineItem.quantity;
    const discountAmount = lineItem.discountCents;
    const additionalCharges = lineItem.additionalChargesCents;
    
    return subtotal - discountAmount + additionalCharges;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        {/* Product Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Product</label>
              {selectedProduct && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProductDetails(!showProductDetails)}
                >
                  {showProductDetails ? 'Hide' : 'Show'} Details
                </Button>
              )}
            </div>
            <ProductSelector
              onProductSelect={handleProductSelect}
              selectedProductId={lineItem.productId}
              customerId={customerId}
            />
          </div>
          
          {selectedProduct && selectedProduct.variations.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Variation</label>
              <Select
                value={lineItem.variationId || ''}
                onValueChange={(value) => {
                  const variation = selectedProduct.variations.find(v => v.id === value);
                  onUpdate(index, { variationId: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select variation" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct.variations.map((variation) => (
                    <SelectItem key={variation.id} value={variation.id}>
                      {variation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <Input
              type="number"
              min="1"
              value={lineItem.quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="text-right"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Unit</label>
            <Select
              value={lineItem.unit}
              onValueChange={(value) => onUpdate(index, { unit: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectedProduct?.units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.unit}>
                    {unit.unit} {unit.isBaseUnit && '(Base)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Unit Price</label>
              {selectedProduct && customerId && (
                <PriceHistoryPopover
                  productId={selectedProduct.id}
                  variationId={lineItem.variationId}
                  customerId={customerId}
                  currentPrice={lineItem.unitPriceCents}
                  unit={lineItem.unit}
                  onPriceSelect={handlePriceHistorySelect}
                />
              )}
            </div>
            <Popover open={priceHistoryOpen} onOpenChange={setPriceHistoryOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={(lineItem.unitPriceCents / 100).toFixed(2)}
                    onChange={(e) => handlePriceChange(parseFloat(e.target.value) * 100 || 0)}
                    onFocus={() => {
                      if (selectedProduct && customerId) {
                        setPriceHistoryOpen(true);
                      }
                    }}
                    className="pl-8 text-right"
                    placeholder="0.00"
                  />
                </div>
              </PopoverTrigger>
              {selectedProduct && customerId && (
                <PopoverContent className="w-[400px] p-0" align="start">
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Price History (Last 5)</h4>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Click on a price to apply it
                      </div>
                    </div>
                    <Separator />
                    <ScrollArea className="max-h-[300px]">
                      <div className="space-y-2">
                        {(() => {
                          if (!selectedProduct || !customerId) return null;
                          
                          const priceHistory = getCustomerPriceHistory(
                            selectedProduct.id,
                            customerId,
                            lineItem.variationId
                          );
                          
                          if (priceHistory.length === 0) {
                            return (
                              <div className="text-center py-8 text-muted-foreground">
                                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No price history available</p>
                                <p className="text-xs mt-1">No previous sales to this customer</p>
                              </div>
                            );
                          }
                          
                          return priceHistory.map((entry, idx) => (
                            <Card
                              key={idx}
                              className="p-3 cursor-pointer hover:bg-accent/30 transition-colors hover:border-primary"
                              onClick={() => {
                                handlePriceHistorySelect(entry.unitPriceCents);
                                setPriceHistoryOpen(false);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold">
                                    {formatCurrency(entry.unitPriceCents)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {entry.invoiceDate.toLocaleDateString()} • Qty: {entry.quantity} {entry.unit}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  Invoice #{entry.invoiceId.slice(-6)}
                                </Badge>
                              </div>
                            </Card>
                          ));
                        })()}
                      </div>
                    </ScrollArea>
                  </div>
                </PopoverContent>
              )}
            </Popover>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Discount</label>
            <div className="relative">
              <Percent className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={(lineItem.discountCents / 100).toFixed(2)}
                onChange={(e) => handleDiscountChange(parseFloat(e.target.value) * 100 || 0)}
                className="pl-8 text-right"
              />
            </div>
          </div>
        </div>

        {/* Additional Charges */}
        <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Additional Charges</span>
          <Badge variant="outline">
            {formatCurrency(lineItem.additionalChargesCents)}
          </Badge>
          </div>
          
          {/* Per-line charges selector */}
          {selectedProduct && (
            <ChargesSelector
              appliedCharges={[]} // Will be populated from lineItem.additionalCharges
              onChargesChange={(charges) => {
                const totalCharges = charges.reduce((sum, charge) => sum + charge.amountCents, 0);
                onUpdate(index, {
                  additionalChargesCents: totalCharges,
                });
              }}
              lineItemIds={[lineItem.id]}
            />
          )}
        </div>

        {/* Agreement Warning */}
        {showAgreementWarning && (
          <div className="mt-2">
            <AgreementWarning
              customerId={customerId!}
              productId={lineItem.productId}
              variationId={lineItem.variationId}
              unit={lineItem.unit}
              quantity={lineItem.quantity}
              enteredPrice={lineItem.unitPriceCents}
              onAction={(action) => {
                console.log('Agreement action:', action);
                setShowAgreementWarning(false);
              }}
            />
          </div>
        )}

        {/* Product Details Panel - Auto-show when product is selected */}
        {showProductDetails && selectedProduct && (
          <div className="mt-4 border-t pt-4">
            <ProductDetailsPanel
              product={selectedProduct}
              variation={selectedVariation || undefined}
              unit={selectedUnit || undefined}
              customerId={customerId}
            />
          </div>
        )}

        {/* Line Total */}
        <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
          <span className="font-medium">Line Total</span>
          <span className="text-lg font-semibold">
            {formatCurrency(calculateLineTotal())}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-destructive"
            disabled={lineItems.length <= 1}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
          
          <div className="text-xs text-muted-foreground">
            Line {index + 1}
          </div>
        </div>
      </div>
    </Card>
  );
}