"use client";

import { useState, useEffect } from 'react';
import { Search, Package, ChevronDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useProductStore } from '@/store/useProductStore';
import { Product, ProductVariation, ProductUnit } from '@/types';
import { cn } from '@/lib/utils';

interface ProductSelectorProps {
  onProductSelect: (product: Product, variation?: ProductVariation, unit?: ProductUnit) => void;
  selectedProductId?: string;
  customerId?: string;
  className?: string;
}

export function ProductSelector({ 
  onProductSelect, 
  selectedProductId, 
  customerId,
  className 
}: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);
  
  const {
    products,
    selectedProduct,
    selectedVariation,
    selectedUnit,
    searchQuery: storeSearchQuery,
    filters,
    isLoading,
    setSearchQuery: setStoreSearchQuery,
    setFilters,
    selectProduct,
    selectVariation,
    selectUnit,
    getFilteredProducts,
  } = useProductStore();

  // Sync local search with store
  useEffect(() => {
    setStoreSearchQuery(searchQuery);
  }, [searchQuery, setStoreSearchQuery]);

  // Get filtered products from store
  const filteredProducts = getFilteredProducts();


  const handleProductSelect = (product: Product, variation?: ProductVariation, unit?: ProductUnit) => {
    selectProduct(product);
    selectVariation(variation || null);
    selectUnit(unit || null);
    onProductSelect(product, variation, unit);
    setIsOpen(false);
  };

  const getStockStatus = (product: Product) => {
    if (!product.trackInventory) return null;
    
    if (product.stockQuantity <= product.minStockLevel) return { status: 'low', text: 'Low Stock' };
    if (product.stockQuantity === 0) return { status: 'out', text: 'Out of Stock' };
    return { status: 'in', text: `${product.stockQuantity} available` };
  };

  const formatPrice = (price: number, unit: string) => {
    return `$${price.toFixed(2)} / ${unit}`;
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedProduct ? (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>
              {selectedProduct.name}
              {selectedVariation && ` - ${selectedVariation.name}`}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">Select product...</span>
        )}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          <div className="p-3 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, SKU, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  // Prevent dropdown from closing on Enter
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                className="pl-8"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>


            {/* Quick Add Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                // TODO: Open add product dialog
                console.log('Add new product');
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          </div>

          <Separator />

          <ScrollArea className="max-h-[500px]">
            <div className="p-2">
              {products.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No products available</p>
                  <p className="text-xs mt-1">Add products to get started</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No products found</p>
                  <p className="text-xs mt-1">Try adjusting your search</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    const isSelected = selectedProduct?.id === product.id;
                    const baseUnit = product.units.find(u => u.unit === product.baseUnit || u.isBaseUnit) || product.units[0];
                    const basePrice = baseUnit?.price || 0;

                    return (
                      <Card
                        key={product.id}
                        className={cn(
                          "p-4 cursor-pointer hover:shadow-md transition-all border-2 group",
                          isSelected && "border-primary bg-primary/5 shadow-md"
                        )}
                        onClick={() => {
                          // Select product directly - use base unit automatically
                          handleProductSelect(product, undefined, baseUnit);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={cn(
                              "p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors",
                              isSelected && "bg-primary/20"
                            )}>
                              <Package className={cn(
                                "h-5 w-5",
                                isSelected ? "text-primary" : "text-primary/70"
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                "font-semibold truncate mb-1",
                                isSelected && "text-primary"
                              )}>
                                {product.name}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                <span>SKU: {product.sku}</span>
                                {product.description && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{product.description}</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {basePrice > 0 && (
                                  <Badge variant="outline" className="text-xs font-medium">
                                    ${(basePrice / 100).toFixed(2)} / pcs
                                  </Badge>
                                )}
                                {product.trackInventory && (
                                  <Badge variant="outline" className="text-xs">
                                    Stock: {product.stockQuantity} pcs
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {stockStatus && (
                              <Badge
                                variant={
                                  stockStatus.status === 'out' ? 'destructive' :
                                  stockStatus.status === 'low' ? 'secondary' : 'default'
                                }
                                className="text-xs"
                              >
                                {stockStatus.text}
                              </Badge>
                            )}
                            {product.variations.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {product.variations.length} var{product.variations.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />
          
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}