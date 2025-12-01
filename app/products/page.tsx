"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { AddProductModal } from "@/components/products/add-product-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

export default function ProductsPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  
  const products = useQuery(
    api.queries.products.getProducts,
    userEmail ? { userEmail } : "skip"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your pharmacy products and inventory
          </p>
        </div>
        <AddProductModal />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            All Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products === undefined ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found. Create your first product to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Base Unit</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: any) => (
                  <TableRow key={product._id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.brand?.name || "-"}</TableCell>
                    <TableCell>{product.category?.name || "-"}</TableCell>
                    <TableCell>
                      {product.baseUnit?.name} ({product.baseUnit?.abbreviation})
                    </TableCell>
                    <TableCell>
                      {product.stockQuantity} {product.baseUnit?.abbreviation}
                      {product.minStockLevel > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (Min: {product.minStockLevel})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(product.salePrice / 100).toFixed(2)} / {product.baseUnit?.abbreviation}
                    </TableCell>
                    <TableCell>
                      {(product.purchasePrice / 100).toFixed(2)} / {product.baseUnit?.abbreviation}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
