"use client";

import { useState } from 'react';
import { Package, Ruler, DollarSign, Clock, Image as ImageIcon, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useProductStore } from '@/store/useProductStore';
import { Product, ProductVariation, ProductUnit } from '@/types';
import { cn } from '@/lib/utils';

interface ProductDetailsPanelProps {
  product: Product;
  variation?: ProductVariation;
  unit?: ProductUnit;
  customerId?: string;
  className?: string;
}

export function ProductDetailsPanel({ 
  product, 
  variation, 
  unit, 
  customerId,
  className 
}: ProductDetailsPanelProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedTab, setSelectedTab] = useState('details');
  
  const { priceHistory, priceAgreements, getPriceHistoryForCustomer } = useProductStore();

  // Get customer-specific price history
  const customerPriceHistory = customerId 
    ? getPriceHistoryForCustomer(customerId, product.id, variation?.id)
    : [];

  // Get relevant price agreements
  const relevantAgreements = priceAgreements.filter(
    ag => ag.productId === product.id && ag.isActive
  );

  const formatPrice = (price: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price / 100); // Convert cents to dollars
  };

  const getStockStatus = () => {
    if (!product.trackInventory) return null;
    
    if (product.stockQuantity === 0) return { status: 'out', text: 'Out of Stock', color: 'destructive' };
    if (product.stockQuantity <= product.minStockLevel) return { status: 'low', text: 'Low Stock', color: 'warning' };
    return { status: 'in', text: `${product.stockQuantity} in stock`, color: 'success' };
  };

  const stockStatus = getStockStatus();

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{product.name}</h3>
              {stockStatus && (
                <Badge variant={stockStatus.color as any}>
                  {stockStatus.text}
                </Badge>
              )}
            </div>
            {variation && (
              <div className="text-sm text-muted-foreground">
                Variation: {variation.name}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              SKU: {variation?.sku || product.sku}
            </div>
          </div>
          
          {unit && (
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatPrice(unit.price)}
              </div>
              <div className="text-sm text-muted-foreground">
                per {unit.unit}
              </div>
            </div>
          )}
        </div>

        {/* Images */}
        {product.images.length > 0 && (
          <div className="space-y-2">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={product.images[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEyMCA4MEwxNDAgMTAwTDEyMCAxMjBMMTAwIDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                }}
              />
            </div>
            
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden",
                      selectedImageIndex === index ? "border-primary" : "border-muted"
                    )}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3">
            {product.description && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Description</span>
                </div>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}

            {product.brand && (
              <div>
                <span className="font-medium">Brand:</span> {product.brand}
              </div>
            )}

            <div>
              <span className="font-medium">Category:</span> {product.categoryId}
            </div>

            <div>
              <span className="font-medium">Track Inventory:</span>{' '}
              <Badge variant={product.trackInventory ? 'default' : 'secondary'}>
                {product.trackInventory ? 'Yes' : 'No'}
              </Badge>
            </div>

            {product.trackInventory && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Min Stock Level:</span> {product.minStockLevel}
                </div>
                <div>
                  <span className="font-medium">Max Stock Level:</span> {product.maxStockLevel}
                </div>
              </div>
            )}

            {product.barcode && (
              <div>
                <span className="font-medium">Barcode:</span> {product.barcode}
              </div>
            )}

            {variation?.barcode && (
              <div>
                <span className="font-medium">Variation Barcode:</span> {variation.barcode}
              </div>
            )}

            {variation && Object.keys(variation.attributes).length > 0 && (
              <div>
                <div className="font-medium mb-2">Variation Attributes</div>
                <div className="space-y-1">
                  {Object.entries(variation.attributes).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="text-muted-foreground">{key}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pricing" className="space-y-3">
            {unit && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Current Pricing</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Selling Price:</span>
                      <span className="font-medium">{formatPrice(unit.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost Price:</span>
                      <span className="font-medium">{formatPrice(unit.cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Margin:</span>
                      <span className="font-medium">
                        {((unit.price - unit.cost) / unit.price * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {relevantAgreements.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Price Agreements</span>
                </div>
                <div className="space-y-2">
                  {relevantAgreements.map((agreement) => (
                    <Card key={agreement.id} className="p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Min Price: {formatPrice(agreement.minUnitPriceCents)}</div>
                          <div className="text-xs text-muted-foreground">
                            Unit: {agreement.unit}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {agreement.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="units" className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Available Units</span>
              </div>
              <div className="space-y-2">
                {product.units.map((productUnit) => (
                  <Card key={productUnit.id} className={cn("p-3", unit?.id === productUnit.id && "border-primary")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{productUnit.unit}</div>
                        <div className="text-sm text-muted-foreground">
                          {productUnit.conversionFactor > 1 && `${productUnit.conversionFactor} base units`}
                          {productUnit.isBaseUnit && ' (Base Unit)'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatPrice(productUnit.price)}</div>
                        <div className="text-sm text-muted-foreground">
                          Cost: {formatPrice(productUnit.cost)}
                        </div>
                      </div>
                    </div>
                    
                    {productUnit.barcode && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Barcode: {productUnit.barcode}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {customerId ? 'Customer Price History' : 'Recent Sales'}
                </span>
              </div>
              
              {customerPriceHistory.length > 0 ? (
                <div className="space-y-2">
                  {customerPriceHistory.map((entry, index) => (
                    <Card key={index} className="p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{formatPrice(entry.unitPriceCents)}</div>
                          <div className="text-xs text-muted-foreground">
                            {entry.invoiceDate.toLocaleDateString()} • Qty: {entry.quantity}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {entry.unit}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No price history available</p>
                  {customerId && (
                    <p className="text-xs mt-1">No previous sales to this customer</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}