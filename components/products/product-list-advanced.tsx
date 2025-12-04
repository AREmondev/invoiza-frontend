"use client";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { AdvancedDataTable, AdvancedColumnDef, ColumnFilterConfig } from '@/components/ui/advanced-data-table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash, Eye, Package, DollarSign, Box, AlertCircle, Calendar, Tag, Building2, Layers, Info, X } from 'lucide-react';
import { AddProductModal } from './add-product-modal';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductListWithAdvancedTableProps {
  userId: string;
}

export function ProductListWithAdvancedTable({ userId }: ProductListWithAdvancedTableProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [editDialogProduct, setEditDialogProduct] = useState<any | null>(null);
  const [deleteDialogProduct, setDeleteDialogProduct] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    sku: "",
    description: "",
    barcode: "",
    salePrice: 0,
    purchasePrice: 0,
    stockQuantity: 0,
    minStockLevel: 0,
    maxStockLevel: 10000,
    fakePrice: false,
    brandId: "",
    categoryId: "",
    expiryDate: undefined as Date | undefined,
  });

  // Unit pricing state for edit
  const [editUnitPricings, setEditUnitPricings] = useState<any[]>([]);
  const [editBaseSalePrice, setEditBaseSalePrice] = useState<number>(0);
  const [editBasePurchasePrice, setEditBasePurchasePrice] = useState<number>(0);
  const [editBaseStockQuantity, setEditBaseStockQuantity] = useState<number>(0);

  const units = useQuery(
    api.queries.units.getUnits,
    userEmail ? { userEmail } : "skip"
  );
  const conversions = useQuery(
    api.queries.units.getUnitConversions,
    userEmail ? { userEmail } : "skip"
  );

  const brands = useQuery(
    api.queries.brands.getBrands,
    userEmail ? { userEmail } : "skip"
  );
  const categories = useQuery(
    api.queries.categories.getCategories,
    userEmail ? { userEmail } : "skip"
  );

  const products = useQuery(
    api.queries.products.getProducts,
    userEmail ? { userEmail } : "skip"
  );

  // const godowns = useQuery(
  //   api.queries.godowns.getGodowns,
  //   userEmail ? { userEmail } : "skip"
  // );

  const updateProduct = useMutation(api.mutations.products.updateProduct);
  const deleteProduct = useMutation(api.mutations.products.deleteProduct);

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
  };

  const handleEditProduct = (product: any) => {
    setEditDialogProduct(product);
    
    // Set base prices and stock
    const baseSalePrice = product.salePrice !== undefined && product.salePrice !== null ? product.salePrice / 100 : 0;
    const basePurchasePrice = product.purchasePrice !== undefined && product.purchasePrice !== null ? product.purchasePrice / 100 : 0;
    const baseStockQuantity = product.stockQuantity !== undefined && product.stockQuantity !== null ? product.stockQuantity : 0;
    
    setEditBaseSalePrice(baseSalePrice);
    setEditBasePurchasePrice(basePurchasePrice);
    setEditBaseStockQuantity(baseStockQuantity);
    
    // Load unit pricing if exists
    if (product.unitPricingDetails && product.unitPricingDetails.length > 0) {
      const unitPricingData = product.unitPricingDetails.map((up: any) => ({
        unitId: up.unitId || up.unit?.unitId,
        salePrice: up.salePrice ? up.salePrice / 100 : 0,
        purchasePrice: up.purchasePrice ? up.purchasePrice / 100 : 0,
      }));
      setEditUnitPricings(unitPricingData);
    } else if (product.unitPricing && product.unitPricing.length > 0) {
      // Fallback to unitPricing if unitPricingDetails not available
      const unitPricingData = product.unitPricing.map((up: any) => ({
        unitId: up.unitId,
        salePrice: up.salePrice ? up.salePrice / 100 : 0,
        purchasePrice: up.purchasePrice ? up.purchasePrice / 100 : 0,
      }));
      setEditUnitPricings(unitPricingData);
    } else {
      setEditUnitPricings([]);
    }
    
    
    setEditFormData({
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      barcode: product.barcode || "",
      salePrice: baseSalePrice,
      purchasePrice: basePurchasePrice,
      stockQuantity: baseStockQuantity,
      minStockLevel: product.minStockLevel !== undefined && product.minStockLevel !== null ? product.minStockLevel : 0,
      maxStockLevel: product.maxStockLevel !== undefined && product.maxStockLevel !== null ? product.maxStockLevel : 10000,
      fakePrice: product.fakePrice || false,
      brandId: product.brandId || "",
      categoryId: product.categoryId || "",
      expiryDate: product.metadata?.expiryDate ? new Date(product.metadata.expiryDate) : undefined,
    });
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!editDialogProduct) {
      setEditFormData({
        name: "",
        sku: "",
        description: "",
        barcode: "",
        salePrice: 0,
        purchasePrice: 0,
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 10000,
        fakePrice: false,
        brandId: "",
        categoryId: "",
        expiryDate: undefined,
      });
      setEditUnitPricings([]);
      setEditBaseSalePrice(0);
      setEditBasePurchasePrice(0);
      setEditBaseStockQuantity(0);
    }
  }, [editDialogProduct]);

  const handleDeleteProduct = (product: any) => {
    setDeleteDialogProduct(product);
  };

  const handleSaveEdit = async () => {
    if (!editDialogProduct || isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      // Validation
      if (!editFormData.name.trim()) {
        toast({
          title: "Error",
          description: "Product name is required",
          variant: "destructive",
        });
        setIsUpdating(false);
        return;
      }

      if (editFormData.salePrice < 0 || editFormData.purchasePrice < 0) {
        toast({
          title: "Error",
          description: "Prices cannot be negative",
          variant: "destructive",
        });
        setIsUpdating(false);
        return;
      }

      if (editFormData.stockQuantity < 0) {
        toast({
          title: "Error",
          description: "Stock quantity cannot be negative",
          variant: "destructive",
        });
        setIsUpdating(false);
        return;
      }
      // Get existing product to preserve metadata
      const existingProduct = products?.find((p: any) => p._id === editDialogProduct._id);
      if (!existingProduct) {
        toast({
          title: "Error",
          description: "Product not found",
          variant: "destructive",
        });
        return;
      }

      const existingMetadata = existingProduct.metadata || {};
      
      // Update metadata with expiry date if provided
      let updatedMetadata = { ...existingMetadata };
      if (editFormData.expiryDate) {
        updatedMetadata.expiryDate = editFormData.expiryDate.toISOString();
      } else if (existingMetadata.expiryDate) {
        // Keep existing expiry date if not changed
        updatedMetadata.expiryDate = existingMetadata.expiryDate;
      }

      // Prepare unit pricing for update - use existing if no changes
      let unitPricing = undefined;
      if (editUnitPricings.length > 0) {
        unitPricing = editUnitPricings.map((up: any) => ({
          unitId: up.unitId as any,
          salePrice: Math.round((up.salePrice || 0) * 100),
          purchasePrice: Math.round((up.purchasePrice || 0) * 100),
        }));
      } else if (existingProduct.unitPricing && existingProduct.unitPricing.length > 0) {
        // Keep existing unit pricing if not modified
        unitPricing = existingProduct.unitPricing;
      }

      // Prepare update data without fakePrice first (since Convex hasn't synced it yet)
      // TODO: Once Convex syncs, we can add fakePrice back
      const updateData: any = {
        productId: editDialogProduct._id,
        name: editFormData.name.trim(),
        description: editFormData.description?.trim() || undefined,
        barcode: editFormData.barcode?.trim() || undefined,
        brandId: editFormData.brandId ? (editFormData.brandId as any) : undefined,
        categoryId: editFormData.categoryId ? (editFormData.categoryId as any) : undefined,
        salePrice: Math.round((editFormData.salePrice || 0) * 100),
        purchasePrice: Math.round((editFormData.purchasePrice || 0) * 100),
        stockQuantity: editFormData.stockQuantity || 0,
        minStockLevel: editFormData.minStockLevel || 0,
        maxStockLevel: editFormData.maxStockLevel || 10000,
        unitPricing: unitPricing,
        metadata: Object.keys(updatedMetadata).length > 0 ? updatedMetadata : existingProduct.metadata,
        userEmail: userEmail || undefined,
      };

      // Try with fakePrice first, fallback to without it if error
      try {
        await updateProduct({
          ...updateData,
          fakePrice: editFormData.fakePrice,
        });
      } catch (error: any) {
        // Convex errors might be in different formats, check all possibilities
        const errorStr = JSON.stringify(error || {});
        const errorMessage = error?.message || error?.toString() || errorStr || '';
        
        // Check if error is about fakePrice validation
        const isFakePriceError = 
          errorMessage.includes('fakePrice') || 
          errorMessage.includes('extra field') || 
          errorMessage.includes('ArgumentValidationError') ||
          errorMessage.includes('not in the validator') ||
          errorStr.includes('fakePrice');
        
        if (isFakePriceError) {
          console.warn('⚠️ fakePrice not recognized by Convex validator. Retrying without it.');
          console.warn('💡 Please restart Convex dev server: npx convex dev');
          // Retry without fakePrice
          try {
            await updateProduct(updateData);
          } catch (retryError: any) {
            // If retry also fails, throw the original error
            throw error;
          }
        } else {
          // Re-throw if it's a different error
          throw error;
        }
      }
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setEditDialogProduct(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialogProduct || isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      await deleteProduct({
        productId: deleteDialogProduct._id,
        userEmail: userEmail || undefined,
      });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setDeleteDialogProduct(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  // Transform products data for the table
  const tableData = products || [];

  // Advanced column definitions with filter configurations
  const columns: AdvancedColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 40,
    },
    {
      accessorKey: "name",
      header: "Product Name",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div>
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-gray-500">
              {product.sku || 'No SKU'}
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Search by name..."
      },
      size: 200,
    },
    {
      accessorKey: "brand",
      header: "Brand",
      cell: ({ row }) => {
        const product = row.original;
        return product.brand?.name || "-";
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by brand..."
      },
      size: 150,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const product = row.original;
        return product.category?.name || "-";
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by category..."
      },
      size: 150,
    },
    {
      accessorKey: "baseUnit",
      header: "Base Unit",
      cell: ({ row }) => {
        const product = row.original;
        return product.baseUnit ? `${product.baseUnit.name} (${product.baseUnit.abbreviation})` : "-";
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by unit..."
      },
      size: 150,
    },
    {
      accessorKey: "stockQuantity",
      header: "Stock",
      cell: ({ row }) => {
        const product = row.original;
        // Find smallest unit by matching unitPricingDetails with conversionDetails
        const unitPricing = product.unitPricingDetails || [];
        const conversions = product.conversionDetails || [];
        
        // Find conversion factor for each unit pricing
        const unitsWithFactors = unitPricing.map((up: any) => {
          const conv = conversions.find((c: any) => 
            c.baseUnitId === product.baseUnitId && c.secondaryUnitId === up.unitId
          );
          return {
            ...up,
            conversionFactor: conv?.conversionFactor || 1,
          };
        });
        
        // Find smallest unit (highest conversion factor)
        const smallestUnit = unitsWithFactors.length > 0 
          ? unitsWithFactors.reduce((smallest: any, current: any) => {
              const smallestFactor = smallest?.conversionFactor || 1;
              const currentFactor = current?.conversionFactor || 1;
              return currentFactor > smallestFactor ? current : smallest;
            })
          : null;
        
        const conversionFactor = smallestUnit?.conversionFactor || 1;
        const totalInSmallestUnit = product.stockQuantity * conversionFactor;
        
        return (
          <div className="text-sm">
            <div className="font-medium">
              {product.stockQuantity} {product.baseUnit?.abbreviation || ""}
            </div>
            {smallestUnit && conversionFactor > 1 && (
              <div className="text-xs text-blue-600 font-medium">
                {conversionFactor} × {product.stockQuantity} = {totalInSmallestUnit} {smallestUnit.unit?.abbreviation || ""}
              </div>
            )}
            {product.minStockLevel > 0 && (
              <div className="text-xs text-gray-500">
                Min: {product.minStockLevel}
              </div>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "range",
        placeholder: "Filter stock range"
      },
      size: 150,
    },
    {
      accessorKey: "salePrice",
      header: "Sale Price",
      cell: ({ row }) => {
        const product = row.original;
        const basePrice = (product.salePrice / 100).toFixed(2);
        const unitPricing = product.unitPricingDetails || [];
        const conversions = product.conversionDetails || [];
        
        // Find conversion factor for each unit pricing and get smallest unit
        const unitsWithFactors = unitPricing.map((up: any) => {
          const conv = conversions.find((c: any) => 
            c.baseUnitId === product.baseUnitId && c.secondaryUnitId === up.unitId
          );
          return {
            ...up,
            conversionFactor: conv?.conversionFactor || 1,
          };
        });
        
        const smallestUnit = unitsWithFactors.length > 0 
          ? unitsWithFactors.reduce((smallest: any, current: any) => {
              const smallestFactor = smallest?.conversionFactor || 1;
              const currentFactor = current?.conversionFactor || 1;
              return currentFactor > smallestFactor ? current : smallest;
            })
          : null;
        
        return (
          <div className="text-sm">
            <div className="font-medium">${basePrice}</div>
            <div className="text-gray-500 text-xs">per {product.baseUnit?.abbreviation || ""}</div>
            {smallestUnit && smallestUnit.conversionFactor > 1 && (
              <div className="mt-1">
                <div className="text-xs text-blue-600 font-medium">
                  ${((smallestUnit.salePrice || 0) / 100).toFixed(2)}/{smallestUnit.unit?.abbreviation || ""}
                </div>
                <div className="text-xs text-gray-400">(Min unit)</div>
              </div>
            )}
            {unitPricing.length > 1 && (
              <div className="text-xs text-gray-400 mt-0.5">+{unitPricing.length - 1} more</div>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "range",
        placeholder: "Filter price range"
      },
      size: 150,
    },
    {
      accessorKey: "purchasePrice",
      header: "Purchase Price",
      cell: ({ row }) => {
        const product = row.original;
        const basePrice = (product.purchasePrice / 100).toFixed(2);
        const unitPricing = product.unitPricingDetails || [];
        const conversions = product.conversionDetails || [];
        
        // Find conversion factor for each unit pricing and get smallest unit
        const unitsWithFactors = unitPricing.map((up: any) => {
          const conv = conversions.find((c: any) => 
            c.baseUnitId === product.baseUnitId && c.secondaryUnitId === up.unitId
          );
          return {
            ...up,
            conversionFactor: conv?.conversionFactor || 1,
          };
        });
        
        const smallestUnit = unitsWithFactors.length > 0 
          ? unitsWithFactors.reduce((smallest: any, current: any) => {
              const smallestFactor = smallest?.conversionFactor || 1;
              const currentFactor = current?.conversionFactor || 1;
              return currentFactor > smallestFactor ? current : smallest;
            })
          : null;
        
        return (
          <div className="text-sm">
            <div className="font-medium">${basePrice}</div>
            <div className="text-gray-500 text-xs">per {product.baseUnit?.abbreviation || ""}</div>
            {smallestUnit && smallestUnit.conversionFactor > 1 && (
              <div className="mt-1">
                <div className="text-xs text-blue-600 font-medium">
                  ${((smallestUnit.purchasePrice || 0) / 100).toFixed(2)}/{smallestUnit.unit?.abbreviation || ""}
                </div>
                <div className="text-xs text-gray-400">(Min unit)</div>
              </div>
            )}
            {unitPricing.length > 1 && (
              <div className="text-xs text-gray-400 mt-0.5">+{unitPricing.length - 1} more</div>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "range",
        placeholder: "Filter price range"
      },
      size: 150,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("isActive")),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "select",
        options: [
          { label: "Active", value: "true" },
          { label: "Inactive", value: "false" }
        ],
        placeholder: "Filter by status"
      },
      size: 100,
    },
    {
      accessorKey: "fakePrice",
      header: "Fake Price",
      cell: ({ row }) => {
        const product = row.original;
        return product.fakePrice ? (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">Yes</Badge>
        ) : (
          <Badge variant="secondary">No</Badge>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "select",
        options: [
          { label: "Yes", value: "true" },
          { label: "No", value: "false" }
        ],
        placeholder: "Filter by fake price"
      },
      size: 100,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleViewProduct(product)}
              title="View Details"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleEditProduct(product)}
              title="Edit Product"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => handleDeleteProduct(product)}
              title="Delete Product"
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      size: 120,
    },
  ];

  const actions = [
    {
      label: "View Details",
      action: (product: any) => handleViewProduct(product),
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: "Export Selected",
      action: (product: any) => {
        console.log('Export product:', product);
        // TODO: Implement export functionality
      },
      icon: <Package className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Product Directory</h2>
          <Badge variant="secondary" className="text-sm">
            {tableData.length} products
          </Badge>
        </div>
      </div>

      {products === undefined ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading products...
        </div>
      ) : (
        <AdvancedDataTable
          columns={columns}
          data={tableData}
          tableId="products"
          userId={userId}
          searchable={true}
          columnVisibility={true}
          pagination={true}
          rowSelection={true}
          actions={actions}
          enableGrouping={true}
          enableAggregating={true}
          enableExport={true}
          exportFormats={["csv", "excel"]}
          enableAdvancedFilters={true}
          enableMultiSort={true}
          defaultPageSize={10}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          onSelectionChange={(selectedProducts) => {
            console.log('Selected products:', selectedProducts);
          }}
        />
      )}

      {/* Product Details Modal - Enhanced UI/UX */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedProduct.name}</h2>
                  <div className="flex items-center gap-4 text-blue-100 text-sm">
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      <span>SKU: {selectedProduct.sku || "N/A"}</span>
                    </div>
                    {selectedProduct.barcode && (
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>Barcode: {selectedProduct.barcode}</span>
                      </div>
                    )}
                    <div>{getStatusBadge(selectedProduct.isActive)}</div>
                    {selectedProduct.fakePrice && (
                      <Badge variant="default" className="bg-yellow-500 text-white">Fake Price</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-blue-800 h-8 w-8"
                  onClick={() => setSelectedProduct(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Product Information Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-600" />
                        Product Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Brand</div>
                          <div className="font-medium">{selectedProduct.brand?.name || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Category</div>
                          <div className="font-medium">{selectedProduct.category?.name || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Base Unit</div>
                          <div className="font-medium">
                            {selectedProduct.baseUnit?.name || "N/A"} ({selectedProduct.baseUnit?.abbreviation || ""})
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Status</div>
                          <div>{getStatusBadge(selectedProduct.isActive)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pricing Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Pricing Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Sale Price</div>
                          <div className="text-2xl font-bold text-green-700">
                            ${(selectedProduct.salePrice / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">per {selectedProduct.baseUnit?.abbreviation || ""}</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Purchase Price</div>
                          <div className="text-2xl font-bold text-blue-700">
                            ${(selectedProduct.purchasePrice / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">per {selectedProduct.baseUnit?.abbreviation || ""}</div>
                        </div>
                      </div>
                      <Separator />
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Total Stock Value</div>
                        <div className="text-xl font-bold text-purple-700">
                          ${((selectedProduct.stockValue || 0) / 100).toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Unit Pricing Card */}
                  {selectedProduct.unitPricingDetails && selectedProduct.unitPricingDetails.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Layers className="h-5 w-5 text-purple-600" />
                          Unit Pricing
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedProduct.unitPricingDetails.map((up: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="font-medium mb-2">{up.unit?.name}</div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Sale:</span>{" "}
                                  <span className="font-semibold text-green-600">${(up.salePrice / 100).toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Purchase:</span>{" "}
                                  <span className="font-semibold text-blue-600">${(up.purchasePrice / 100).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Stock Information Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Box className="h-5 w-5 text-orange-600" />
                        Stock Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Current Stock</div>
                        <div className="text-3xl font-bold text-orange-700">
                          {selectedProduct.stockQuantity}
                        </div>
                        <div className="text-sm text-gray-500">{selectedProduct.baseUnit?.abbreviation || ""}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Min Level</div>
                          <div className="text-lg font-semibold">{selectedProduct.minStockLevel || "N/A"}</div>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Max Level</div>
                          <div className="text-lg font-semibold">{selectedProduct.maxStockLevel || "N/A"}</div>
                        </div>
                      </div>
                      {selectedProduct.stockQuantity <= selectedProduct.minStockLevel && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <span className="text-sm text-yellow-800">Stock is at or below minimum level</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Godown Stocks Card - Commented out temporarily */}
                  {/* {selectedProduct.godownStocks && selectedProduct.godownStocks.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-indigo-600" />
                          Godown Stocks
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedProduct.godownStocks.map((gs: any, idx: number) => {
                            const godown = godowns?.find((g: any) => g._id === gs.godownId);
                            return (
                              <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="font-medium">{godown?.name || gs.godownId}</div>
                                <div className="text-sm text-gray-600">
                                  Quantity: <span className="font-semibold">{gs.quantity}</span> {selectedProduct.baseUnit?.abbreviation || ""}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )} */}

                  {/* Variations Card */}
                  {selectedProduct.variations && selectedProduct.variations.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Package className="h-5 w-5 text-pink-600" />
                          Variations ({selectedProduct.variations.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedProduct.variations.map((variation: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium">{variation.name}</div>
                                {variation.color && (
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-5 h-5 rounded-full border-2 border-gray-300" 
                                      style={{ backgroundColor: variation.color }}
                                    />
                                    <span className="text-xs text-gray-500">{variation.color}</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">SKU: {variation.sku}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Expiry Date Card */}
                  {selectedProduct.metadata?.expiryDate && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-red-600" />
                          Expiry Date
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="text-lg font-semibold text-red-700">
                            {format(new Date(selectedProduct.metadata.expiryDate), "PPP")}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Description Card */}
                  {selectedProduct.description && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {selectedProduct.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 bg-gray-50 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                Close
              </Button>
              <Button onClick={() => {
                setSelectedProduct(null);
                handleEditProduct(selectedProduct);
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Dialog - Similar to Add Product */}
      {editDialogProduct && (
        <Dialog open={!!editDialogProduct} onOpenChange={() => setEditDialogProduct(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Product Name *</Label>
                    <Input
                      id="edit-name"
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-sku">SKU</Label>
                    <Input
                      id="edit-sku"
                      value={editFormData.sku}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-brand">Brand</Label>
                    <select
                      id="edit-brand"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={editFormData.brandId}
                      onChange={(e) => setEditFormData({ ...editFormData, brandId: e.target.value })}
                    >
                      <option value="">Select a brand</option>
                      {brands?.map((brand: any) => (
                        <option key={brand._id} value={brand._id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <select
                      id="edit-category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={editFormData.categoryId}
                      onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                    >
                      <option value="">Select a category</option>
                      {categories?.map((category: any) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-fake-price"
                    checked={editFormData.fakePrice}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, fakePrice: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit-fake-price">Fake Price</Label>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Unit & Pricing Configuration</h3>
                  
                  {/* Base Unit Pricing */}
                  <div className="space-y-4 border rounded-lg p-6 bg-white">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Base Unit Pricing</h4>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sale Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editFormData.salePrice !== undefined && editFormData.salePrice !== null ? editFormData.salePrice : ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setEditFormData({ ...editFormData, salePrice: value });
                              setEditBaseSalePrice(value);
                            }}
                            className="pl-7 border-gray-300 rounded-md focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          per {editDialogProduct?.baseUnit?.abbreviation || ""}
                        </div>
                        {/* Show smallest unit price if available */}
                        {(() => {
                          const unitPricing = editDialogProduct?.unitPricingDetails || [];
                          const conversions = editDialogProduct?.conversionDetails || [];
                          const unitsWithFactors = unitPricing.map((up: any) => {
                            const conv = conversions.find((c: any) => 
                              c.baseUnitId === editDialogProduct?.baseUnitId && c.secondaryUnitId === up.unitId
                            );
                            return {
                              ...up,
                              conversionFactor: conv?.conversionFactor || 1,
                            };
                          });
                          const smallestUnit = unitsWithFactors.length > 0 
                            ? unitsWithFactors.reduce((smallest: any, current: any) => {
                                const smallestFactor = smallest?.conversionFactor || 1;
                                const currentFactor = current?.conversionFactor || 1;
                                return currentFactor > smallestFactor ? current : smallest;
                              })
                            : null;
                          
                          return smallestUnit && smallestUnit.conversionFactor > 1 ? (
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              Min: ${((smallestUnit.salePrice || 0) / 100).toFixed(2)}/{smallestUnit.unit?.abbreviation || ""}
                            </div>
                          ) : null;
                        })()}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Purchase Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editFormData.purchasePrice !== undefined && editFormData.purchasePrice !== null ? editFormData.purchasePrice : ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setEditFormData({ ...editFormData, purchasePrice: value });
                              setEditBasePurchasePrice(value);
                            }}
                            className="pl-7 border-gray-300 rounded-md focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          per {editDialogProduct?.baseUnit?.abbreviation || ""}
                        </div>
                        {/* Show smallest unit price if available */}
                        {(() => {
                          const unitPricing = editDialogProduct?.unitPricingDetails || [];
                          const conversions = editDialogProduct?.conversionDetails || [];
                          const unitsWithFactors = unitPricing.map((up: any) => {
                            const conv = conversions.find((c: any) => 
                              c.baseUnitId === editDialogProduct?.baseUnitId && c.secondaryUnitId === up.unitId
                            );
                            return {
                              ...up,
                              conversionFactor: conv?.conversionFactor || 1,
                            };
                          });
                          const smallestUnit = unitsWithFactors.length > 0 
                            ? unitsWithFactors.reduce((smallest: any, current: any) => {
                                const smallestFactor = smallest?.conversionFactor || 1;
                                const currentFactor = current?.conversionFactor || 1;
                                return currentFactor > smallestFactor ? current : smallest;
                              })
                            : null;
                          
                          return smallestUnit && smallestUnit.conversionFactor > 1 ? (
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              Min: ${((smallestUnit.purchasePrice || 0) / 100).toFixed(2)}/{smallestUnit.unit?.abbreviation || ""}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Unit Pricing for Secondary Units */}
                  {(editUnitPricings.length > 0 || (editDialogProduct?.unitPricingDetails && editDialogProduct.unitPricingDetails.length > 0)) && (
                    <div className="space-y-4 border rounded-lg p-6 bg-white">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Secondary Unit Pricing</h4>
                      </div>
                      
                      <div className="space-y-4">
                        {(editDialogProduct?.unitPricingDetails || []).map((up: any, idx: number) => {
                          const unit = units?.find((u: any) => u._id === up.unitId || u._id === up.unit?._id);
                          const unitPricing = editUnitPricings.find((ep: any) => ep.unitId === up.unitId || ep.unitId === up.unit?._id) || {
                            unitId: up.unitId || up.unit?._id,
                            salePrice: up.salePrice ? up.salePrice / 100 : 0,
                            purchasePrice: up.purchasePrice ? up.purchasePrice / 100 : 0,
                          };
                          
                          // Get conversion factor
                          const conversions = editDialogProduct?.conversionDetails || [];
                          const conv = conversions.find((c: any) => 
                            c.baseUnitId === editDialogProduct?.baseUnitId && c.secondaryUnitId === up.unitId
                          );
                          const conversionFactor = conv?.conversionFactor || 1;
                          const isSmallestUnit = conversions.length > 0 && conversionFactor > 1 && 
                            conversions.every((c: any) => c.conversionFactor <= conversionFactor);
                          
                          if (!unit) return null;
                          
                          return (
                            <div key={idx} className={`p-4 border rounded-lg ${isSmallestUnit ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                              <div className="mb-3 flex items-center justify-between">
                                <Label className="font-medium">{unit.name} ({unit.abbreviation})</Label>
                                {isSmallestUnit && (
                                  <Badge variant="default" className="bg-blue-600 text-white text-xs">Min Unit</Badge>
                                )}
                              </div>
                              {conversionFactor > 1 && (
                                <div className="mb-3 text-xs text-gray-600">
                                  1 {editDialogProduct?.baseUnit?.abbreviation || ""} = {conversionFactor} {unit.abbreviation}
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-600">Sale Price</Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={unitPricing.salePrice !== undefined && unitPricing.salePrice !== null ? unitPricing.salePrice : ""}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        const unitId = up.unitId || up.unit?._id;
                                        const updated = editUnitPricings.map((ep: any) =>
                                          (ep.unitId === unitId) ? { ...ep, salePrice: value } : ep
                                        );
                                        if (!updated.find((ep: any) => ep.unitId === unitId)) {
                                          updated.push({ ...unitPricing, unitId, salePrice: value });
                                        }
                                        setEditUnitPricings(updated);
                                      }}
                                      className="pl-7"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-600">Purchase Price</Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={unitPricing.purchasePrice !== undefined && unitPricing.purchasePrice !== null ? unitPricing.purchasePrice : ""}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        const unitId = up.unitId || up.unit?._id;
                                        const updated = editUnitPricings.map((ep: any) =>
                                          (ep.unitId === unitId) ? { ...ep, purchasePrice: value } : ep
                                        );
                                        if (!updated.find((ep: any) => ep.unitId === unitId)) {
                                          updated.push({ ...unitPricing, unitId, purchasePrice: value });
                                        }
                                        setEditUnitPricings(updated);
                                      }}
                                      className="pl-7"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Stock Information */}
                  <div className="space-y-4 border rounded-lg p-6 bg-white">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Stock Information</h4>
                    
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Current Stock</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editFormData.stockQuantity !== undefined && editFormData.stockQuantity !== null ? editFormData.stockQuantity : ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setEditFormData({ ...editFormData, stockQuantity: value });
                            setEditBaseStockQuantity(value);
                          }}
                          className="border-gray-300 rounded-md focus:ring-blue-500"
                          placeholder="0"
                        />
                        <div className="text-xs text-gray-500">
                          {editDialogProduct?.baseUnit?.abbreviation || ""}
                        </div>
                        {/* Show calculation if smallest unit exists */}
                        {(() => {
                          const unitPricing = editDialogProduct?.unitPricingDetails || [];
                          const conversions = editDialogProduct?.conversionDetails || [];
                          const unitsWithFactors = unitPricing.map((up: any) => {
                            const conv = conversions.find((c: any) => 
                              c.baseUnitId === editDialogProduct?.baseUnitId && c.secondaryUnitId === up.unitId
                            );
                            return {
                              ...up,
                              conversionFactor: conv?.conversionFactor || 1,
                            };
                          });
                          const smallestUnit = unitsWithFactors.length > 0 
                            ? unitsWithFactors.reduce((smallest: any, current: any) => {
                                const smallestFactor = smallest?.conversionFactor || 1;
                                const currentFactor = current?.conversionFactor || 1;
                                return currentFactor > smallestFactor ? current : smallest;
                              })
                            : null;
                          const conversionFactor = smallestUnit?.conversionFactor || 1;
                          const totalInSmallestUnit = (editFormData.stockQuantity || 0) * conversionFactor;
                          
                          return smallestUnit && conversionFactor > 1 ? (
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              {conversionFactor} × {editFormData.stockQuantity || 0} = {totalInSmallestUnit} {smallestUnit.unit?.abbreviation || ""}
                            </div>
                          ) : null;
                        })()}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Min Stock Level</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editFormData.minStockLevel !== undefined && editFormData.minStockLevel !== null ? editFormData.minStockLevel : ""}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, minStockLevel: parseFloat(e.target.value) || 0 })
                          }
                          className="border-gray-300 rounded-md focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Max Stock Level</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editFormData.maxStockLevel !== undefined && editFormData.maxStockLevel !== null ? editFormData.maxStockLevel : ""}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, maxStockLevel: parseFloat(e.target.value) || 0 })
                          }
                          className="border-gray-300 rounded-md focus:ring-blue-500"
                          placeholder="10000"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogProduct(null)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveEdit} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogProduct && (
        <Dialog open={!!deleteDialogProduct} onOpenChange={() => setDeleteDialogProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm">
                Are you sure you want to delete <strong>{deleteDialogProduct.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialogProduct(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AddProductModal open={open} onOpenChange={setOpen} />
    </div>
  );
}

