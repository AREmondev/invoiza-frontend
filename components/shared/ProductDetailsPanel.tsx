"use client";

import { useState } from 'react';
import { Package, Ruler, DollarSign, Clock, Image as ImageIcon, Info, Tag, Box, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  
  const { priceHistory, priceAgreements, getPriceHistoryForCustomer } = useProductStore();

  // Get customer-specific price history
  const customerPriceHistory = customerId 
    ? getPriceHistoryForCustomer(customerId, product.id, variation?.id)
    : [];

  // Get relevant price agreements
  const relevantAgreements = priceAgreements.filter(
    ag => ag.productId === product.id && ag.isActive
  );

  // Get base unit
  const baseUnit = product.units.find(u => u.isBaseUnit || u.unit === product.baseUnit) || product.units[0];

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
    return { status: 'in', text: `${product.stockQuantity} pcs in stock`, color: 'success' };
  };

  const stockStatus = getStockStatus();

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{product.name}</h2>
                  {variation && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Variation: <span className="font-medium">{variation.name}</span>
                    </p>
                  )}
                </div>
                {stockStatus && (
                  <Badge variant={stockStatus.color as any} className="text-sm px-3 py-1">
                    {stockStatus.text}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span>SKU: <span className="font-medium text-foreground">{variation?.sku || product.sku}</span></span>
                </div>
                {product.barcode && (
                  <div className="flex items-center gap-1">
                    <Box className="h-4 w-4" />
                    <span>Barcode: <span className="font-medium text-foreground">{product.barcode}</span></span>
                  </div>
                )}
              </div>
            </div>
            
            {baseUnit && (
              <div className="text-right bg-accent/50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(baseUnit.price)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  per pcs
                </div>
              </div>
            )}
          </div>

          {/* Images */}
          {product.images.length > 0 && (
            <div className="space-y-3">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2">
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
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={cn(
                        "flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all",
                        selectedImageIndex === index ? "border-primary ring-2 ring-primary/20" : "border-muted opacity-60 hover:opacity-100"
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
        </div>

        <Separator />

        {/* Description */}
        {product.description && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Description</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </div>
        )}

        <Separator />

        {/* Pricing Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Pricing Information</h3>
          </div>
          
          {baseUnit && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-accent/30">
                <div className="text-sm text-muted-foreground mb-1">Selling Price</div>
                <div className="text-2xl font-bold text-primary">{formatPrice(baseUnit.price)}</div>
                <div className="text-xs text-muted-foreground mt-1">per pcs</div>
              </Card>
              <Card className="p-4 bg-accent/30">
                <div className="text-sm text-muted-foreground mb-1">Cost Price</div>
                <div className="text-2xl font-bold">{formatPrice(baseUnit.cost)}</div>
                <div className="text-xs text-muted-foreground mt-1">per pcs</div>
              </Card>
            </div>
          )}

          {baseUnit && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Profit Margin</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {((baseUnit.price - baseUnit.cost) / baseUnit.price * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Profit: {formatPrice(baseUnit.price - baseUnit.cost)} per pcs
              </div>
            </Card>
          )}

          {/* Price Agreements */}
          {relevantAgreements.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Price Agreements</h4>
              </div>
              <div className="space-y-2">
                {relevantAgreements.map((agreement) => (
                  <Card key={agreement.id} className="p-3 border-l-4 border-l-primary">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Minimum Price: {formatPrice(agreement.minUnitPriceCents)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Unit: {agreement.unit} • {agreement.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <Badge variant={agreement.isActive ? 'default' : 'secondary'}>
                        {agreement.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Inventory Information */}
        {product.trackInventory && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Inventory</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">Current Stock</div>
                <div className="text-2xl font-bold">{product.stockQuantity}</div>
                <div className="text-xs text-muted-foreground mt-1">pcs</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">Min Level</div>
                <div className="text-2xl font-bold text-orange-600">{product.minStockLevel}</div>
                <div className="text-xs text-muted-foreground mt-1">pcs</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">Max Level</div>
                <div className="text-2xl font-bold text-blue-600">{product.maxStockLevel}</div>
                <div className="text-xs text-muted-foreground mt-1">pcs</div>
              </Card>
            </div>

            {product.stockQuantity <= product.minStockLevel && (
              <Card className="p-3 bg-orange-50 border-orange-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Stock is below minimum level
                  </span>
                </div>
              </Card>
            )}
          </div>
        )}

        <Separator />

        {/* Units Information */}
        {product.units.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Available Units</h3>
            </div>
            <div className="space-y-2">
              {product.units.map((productUnit) => (
                <Card 
                  key={productUnit.id} 
                  className={cn(
                    "p-4 transition-all",
                    productUnit.isBaseUnit && "border-2 border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{productUnit.unit}</span>
                        {productUnit.isBaseUnit && (
                          <Badge variant="default" className="text-xs">Base Unit</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {productUnit.conversionFactor > 1 && (
                          <span>{productUnit.conversionFactor} base units</span>
                        )}
                        {productUnit.barcode && (
                          <span className="ml-2">Barcode: {productUnit.barcode}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPrice(productUnit.price)}</div>
                      <div className="text-sm text-muted-foreground">
                        Cost: {formatPrice(productUnit.cost)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Variation Attributes */}
        {variation && Object.keys(variation.attributes).length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Variation Attributes</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(variation.attributes).map(([key, value]) => (
                <Card key={key} className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">{key}</div>
                  <div className="font-medium">{value}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Price History */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">
              {customerId ? 'Customer Price History' : 'Recent Sales History'}
            </h3>
          </div>
          
          {customerPriceHistory.length > 0 ? (
            <div className="space-y-2">
              {customerPriceHistory.slice(0, 5).map((entry, index) => (
                <Card key={index} className="p-3 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">{formatPrice(entry.unitPriceCents)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {entry.invoiceDate.toLocaleDateString()} • Qty: {entry.quantity} pcs
                      </div>
                    </div>
                    <Badge variant="outline">pcs</Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm font-medium text-muted-foreground">No price history available</p>
              {customerId && (
                <p className="text-xs text-muted-foreground mt-1">No previous sales to this customer</p>
              )}
            </Card>
          )}
        </div>

        {/* Additional Info */}
        <Separator />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          {product.brand && (
            <div>
              <span className="text-muted-foreground">Brand:</span>
              <span className="font-medium ml-2">{product.brand}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Category:</span>
            <span className="font-medium ml-2">{product.categoryId || 'N/A'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Track Inventory:</span>
            <Badge variant={product.trackInventory ? 'default' : 'secondary'} className="ml-2">
              {product.trackInventory ? 'Yes' : 'No'}
            </Badge>
          </div>
          {variation?.barcode && (
            <div>
              <span className="text-muted-foreground">Variation Barcode:</span>
              <span className="font-medium ml-2">{variation.barcode}</span>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
