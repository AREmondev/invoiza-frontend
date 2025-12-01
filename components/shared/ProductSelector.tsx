"use client";

import { useState, useEffect } from 'react';
import { Search, Package, ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  
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

  // Get unique categories from products
  const categories = ['all', ...Array.from(new Set(products.map(p => p.categoryId)))];

  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

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
              {selectedUnit && ` (${selectedUnit.unit})`}
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
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'All Categories' : category}
                </Badge>
              ))}
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

          <ScrollArea className="max-h-[400px]">
            <div className="p-2 space-y-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No products found
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const isExpanded = expandedProducts.has(product.id);
                  const isSelected = selectedProduct?.id === product.id;

                  return (
                    <div key={product.id}>
                      <Card
                        className={cn(
                          "p-3 cursor-pointer hover:bg-accent/50 transition-colors",
                          isSelected && "border-primary bg-accent"
                        )}
                        onClick={() => toggleProductExpansion(product.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 transition-transform",
                                isExpanded && "rotate-90"
                              )}
                            />
                            <Package className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                SKU: {product.sku}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
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
                            <Badge variant="outline" className="text-xs">
                              {product.units.length} units
                            </Badge>
                          </div>
                        </div>
                      </Card>

                      {isExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          {/* Variations */}
                          {product.variations.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground px-3">
                                Variations
                              </div>
                              {product.variations.map((variation) => (
                                <Card
                                  key={variation.id}
                                  className="ml-4 p-2 cursor-pointer hover:bg-accent/30"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleProductSelect(product, variation);
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">{variation.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {variation.sku}
                                    </Badge>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}

                          {/* Units */}
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground px-3">
                              Units & Pricing
                            </div>
                            {product.units.map((unit) => (
                              <Card
                                key={unit.id}
                                className="ml-4 p-2 cursor-pointer hover:bg-accent/30"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProductSelect(product, undefined, unit);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-medium">{unit.unit}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {unit.conversionFactor > 1 && `${unit.conversionFactor} base units`}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium">
                                      {formatPrice(unit.price, unit.unit)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Cost: {formatPrice(unit.cost, unit.unit)}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
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