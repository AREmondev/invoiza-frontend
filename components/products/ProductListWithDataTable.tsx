"use client";

import { useState } from "react";
import { useProductStore } from "@/store/useProductStore";
import { AdvancedDataTable } from "@/components/ui/advanced-data-table";
import type { AdvancedColumnDef } from "@/components/ui/advanced-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  Package,
  BarChart3,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { Product } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductListWithDataTableProps {
  userId: string;
}

export function ProductListWithDataTable({
  userId,
}: ProductListWithDataTableProps) {
  const { products, getFilteredProducts, setSearchQuery } = useProductStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editDialogProduct, setEditDialogProduct] = useState<Product | null>(null);
  const [deleteDialogProduct, setDeleteDialogProduct] = useState<Product | null>(null);
  const [variationsDialogProduct, setVariationsDialogProduct] = useState<Product | null>(null);
  const [priceHistoryDialogProduct, setPriceHistoryDialogProduct] = useState<Product | null>(null);

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity <= 0) return "out_of_stock";
    if (product.stockQuantity <= product.minStockLevel) return "low_stock";
    return "in_stock";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            In Stock
          </Badge>
        );
      case "low_stock":
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            Low Stock
          </Badge>
        );
      case "out_of_stock":
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const baseUnit = (product: Product) => {
    return product.units.find((unit) => unit.isBaseUnit) || product.units[0];
  };

  const totalStockValue = (product: Product) => {
    return product.units.reduce((total, unit) => {
      return total + product.stockQuantity * unit.cost;
    }, 0);
  };

  const handleEditProduct = (product: Product) => {
    console.log("Edit product:", product);
    // TODO: Implement edit product modal
  };

  const handleDeleteProduct = (product: Product) => {
    console.log("Delete product:", product);
    // TODO: Implement delete product confirmation
  };

  const handleManageVariations = (product: Product) => {
    console.log("Manage variations:", product);
    // TODO: Implement variations management
  };

  const handleViewPriceHistory = (product: Product) => {
    console.log("View price history:", product);
    // TODO: Implement price history modal
  };

  const columns: AdvancedColumnDef<Product, any>[] = [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div>
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-gray-500">{product.sku}</div>
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by name"
      }
    },
    {
      id: "price",
      accessorFn: (product) => {
        const unit = baseUnit(product);
        return unit?.price ?? 0;
      },
      header: "Price",
      cell: ({ row }) => {
        const product = row.original;
        const unit = baseUnit(product);
        return (
          <div className="text-sm">
            <div>${unit?.price?.toFixed(2) || "0.00"}</div>
            <div className="text-gray-500">per {unit?.unit}</div>
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "range",
        min: 0,
        max: 100000,
        placeholder: "Filter price range"
      },
      filterFn: "numberRange"
    },
    {
      accessorKey: "stockQuantity",
      header: "Stock",
      cell: ({ row }) => {
        const product = row.original;
        const unit = baseUnit(product);
        const totalValue = totalStockValue(product);
        return (
          <div className="text-sm">
            <div>
              {product.stockQuantity} {unit?.unit}
            </div>
            <div className="text-gray-500">Total: ${totalValue.toFixed(2)}</div>
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "range",
        min: 0,
        max: 100000,
        placeholder: "Filter stock range"
      },
      filterFn: "numberRange"
    },
    {
      accessorFn: (product) => product.metadata?.expiryDate || "",
      header: "Expiry Date",
      cell: ({ row }) => {
        const product = row.original;
        const expiryDate = product.metadata?.expiryDate;
        return expiryDate
          ? format(new Date(expiryDate), "MMM dd, yyyy")
          : "N/A";
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "date",
        placeholder: "Filter by expiry"
      }
    },
    {
      accessorFn: (product) => getStockStatus(product),
      header: "Status",
      cell: ({ row }) => {
        const product = row.original;
        const status = getStockStatus(product);
        return getStatusBadge(status);
      },
      enableSorting: false,
      enableColumnFilter: true,
      filterConfig: {
        type: "select",
        options: [
          { label: "In Stock", value: "in_stock" },
          { label: "Low Stock", value: "low_stock" },
          { label: "Out of Stock", value: "out_of_stock" }
        ],
        placeholder: "Filter by status"
      }
    },
    {
      accessorKey: "brand",
      header: "Brand",
      cell: ({ row }) => {
        const product = row.original;
        return product.brand || "N/A";
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by brand"
      }
    },
    {
      accessorKey: "categoryId",
      header: "Category",
      cell: ({ row }) => {
        const product = row.original;
        return product.categoryId || "N/A";
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by category"
      }
    },
    {
      accessorKey: "minStockLevel",
      header: "Min Stock",
      cell: ({ row }) => {
        const product = row.original;
        return product.minStockLevel;
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "number",
        min: 0,
        placeholder: "Filter by min stock"
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPriceHistoryDialogProduct(product)}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setEditDialogProduct(product)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Product
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setVariationsDialogProduct(product)}>
                  <Package className="mr-2 h-4 w-4" />
                  Manage Variations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriceHistoryDialogProduct(product)}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Price History
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogProduct(product)}
                  className="text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Product
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const actions = [
    {
      label: "View Details",
      action: (row: Product) => setSelectedProduct(row),
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: "Edit Product",
      action: (row: Product) => setEditDialogProduct(row),
      icon: <Pencil className="h-4 w-4" />,
    },
    {
      label: "Manage Variations",
      action: (row: Product) => setVariationsDialogProduct(row),
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: "View Price History",
      action: (row: Product) => setPriceHistoryDialogProduct(row),
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      <AdvancedDataTable
        columns={columns as AdvancedColumnDef<unknown, unknown>[]}
        data={products}
        tableId="products"
        userId={userId}
        searchable={true}
        columnVisibility={true}
        pagination={true}
        rowSelection={true}
        actions={actions}
        enableAdvancedFilters={true}
        enableMultiSort={true}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
      />

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedProduct(null)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">SKU:</span>{" "}
                  {selectedProduct.sku}
                </div>
                <div>
                  <span className="text-gray-500">Brand:</span>{" "}
                  {selectedProduct.brand || "N/A"}
                </div>
                <div>
                  <span className="text-gray-500">Category:</span>{" "}
                  {selectedProduct.categoryId || "N/A"}
                </div>
                <div>
                  <span className="text-gray-500">Min Stock:</span>{" "}
                  {selectedProduct.minStockLevel}
                </div>
              </div>

              {/* Product Variations */}
              {selectedProduct.variations &&
                selectedProduct.variations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Variations ({selectedProduct.variations.length})
                    </h4>
                    <div className="grid gap-2">
                      {selectedProduct.variations.map((variation) => (
                        <div
                          key={variation.id}
                          className="bg-gray-50 p-3 rounded border"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">
                                {variation.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {variation.sku}
                              </div>
                            </div>
                            <Badge variant="outline">
                              {variation.attributes.color || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Product Units */}
              <div>
                <h4 className="font-medium mb-2">
                  Units & Conversions ({selectedProduct.units.length})
                </h4>
                <div className="grid gap-2">
                  {selectedProduct.units.map((unit) => (
                    <div
                      key={unit.id}
                      className="bg-gray-50 p-3 rounded border"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{unit.unit}</div>
                          <div className="text-sm text-gray-500">
                            {unit.isBaseUnit
                              ? "Base Unit"
                              : `Conversion: ${unit.conversionFactor}x`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ${unit.price.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Cost: ${unit.cost.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setSelectedProduct(null)}
              >
                Close
              </Button>
              <Button onClick={() => setEditDialogProduct(selectedProduct)}>
                Edit Product
              </Button>
            </div>
          </div>
        </div>
      )}

      {editDialogProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Product</h2>
              <Button variant="ghost" size="icon" onClick={() => setEditDialogProduct(null)}>×</Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editDialogProduct.name}
                  onChange={(e) => setEditDialogProduct({ ...editDialogProduct, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU</label>
                <Input
                  value={editDialogProduct.sku}
                  onChange={(e) => setEditDialogProduct({ ...editDialogProduct, sku: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setEditDialogProduct(null)}>Cancel</Button>
              <Button onClick={async () => { await useProductStore.getState().updateProduct(editDialogProduct.id, { name: editDialogProduct.name, sku: editDialogProduct.sku }); setEditDialogProduct(null); }}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {deleteDialogProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Delete Product</h2>
            <p className="text-sm mb-6">Are you sure you want to delete {deleteDialogProduct.name}?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogProduct(null)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={async () => { await useProductStore.getState().deleteProduct(deleteDialogProduct.id); setDeleteDialogProduct(null); }}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {variationsDialogProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage Variations</h2>
              <Button variant="ghost" size="icon" onClick={() => setVariationsDialogProduct(null)}>×</Button>
            </div>
            <div className="space-y-2">
              {(variationsDialogProduct.variations || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No variations</div>
              ) : (
                (variationsDialogProduct.variations || []).map((variation) => (
                  <div key={variation.id} className="border rounded p-3">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{variation.name}</div>
                        <div className="text-sm text-muted-foreground">SKU: {variation.sku}</div>
                      </div>
                      <Badge variant="outline">{variation.attributes.color || "N/A"}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setVariationsDialogProduct(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {priceHistoryDialogProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Price History</h2>
              <Button variant="ghost" size="icon" onClick={() => setPriceHistoryDialogProduct(null)}>×</Button>
            </div>
            <div>
              {/* Using basic content to indicate functionality */}
              <div className="text-sm text-muted-foreground mb-2">Recent price history will be shown here.</div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setPriceHistoryDialogProduct(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
