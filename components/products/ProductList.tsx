"use client";

import { useState, useEffect } from "react";
import { useProductStore } from "@/store/useProductStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash, 
  Package, 
  ChevronDown, 
  ChevronRight,
  BarChart3,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Product, ProductVariation, ProductUnit } from "@/types";

interface ProductRowProps {
  product: Product;
  isExpanded: boolean;
  onToggle: () => void;
}

function ProductRow({ product, isExpanded, onToggle }: ProductRowProps) {
  const stockStatus = useProductStore.getState().getStockStatus(product);
  const baseUnit = product.units.find(unit => unit.isBaseUnit) || product.units[0];
  const totalStockValue = product.units.reduce((total, unit) => {
    return total + (product.stockQuantity * unit.cost);
  }, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>;
      case 'low_stock':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-0 h-6 w-6"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <div>
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-gray-500">{product.sku}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <div>${baseUnit?.price?.toFixed(2) || '0.00'}</div>
            <div className="text-gray-500">per {baseUnit?.unit}</div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <div>{product.stockQuantity} {baseUnit?.unit}</div>
            <div className="text-gray-500">Total: ${totalStockValue.toFixed(2)}</div>
          </div>
        </TableCell>
        <TableCell>
          {product.metadata?.expiryDate && format(new Date(product.metadata.expiryDate), "MMM dd, yyyy")}
        </TableCell>
        <TableCell>{getStatusBadge(stockStatus)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Price History</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Product
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Package className="mr-2 h-4 w-4" />
                  Manage Variations
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Product
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={6} className="p-0">
            <div className="bg-gray-50 p-4">
              <div className="space-y-4">
                {/* Product Variations */}
                {product.variations && product.variations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Variations
                    </h4>
                    <div className="grid gap-2">
                      {product.variations.map((variation) => (
                        <div key={variation.id} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{variation.name}</div>
                              <div className="text-sm text-gray-500">SKU: {variation.sku}</div>
                            </div>
                            <Badge variant="outline">{variation.attributes.color || 'N/A'}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Units */}
                <div>
                  <h4 className="font-medium mb-2">Units & Conversions</h4>
                  <div className="grid gap-2">
                    {product.units.map((unit) => (
                      <div key={unit.id} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{unit.unit}</div>
                            <div className="text-sm text-gray-500">
                              {unit.isBaseUnit ? 'Base Unit' : `Conversion: ${unit.conversionFactor}x`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${unit.price.toFixed(2)}</div>
                            <div className="text-sm text-gray-500">Cost: ${unit.cost.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Brand:</span> {product.brand || 'N/A'}
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span> {product.categoryId || 'N/A'}
                  </div>
                  <div>
                    <span className="text-gray-500">Min Stock:</span> {product.minStockLevel}
                  </div>
                  <div>
                    <span className="text-gray-500">Track Inventory:</span> {product.trackInventory ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function ProductList() {
  const { products, getFilteredProducts, setSearchQuery, searchQuery } = useProductStore();
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = getFilteredProducts();

  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setSearchQuery(value);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          {filteredProducts.length} of {products.length} products
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isExpanded={expandedProducts.has(product.id)}
                  onToggle={() => toggleProductExpansion(product.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
