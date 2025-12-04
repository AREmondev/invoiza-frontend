"use client";

import { useState } from 'react';
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { AdvancedDataTable, AdvancedColumnDef } from '@/components/ui/advanced-data-table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

interface BrandsListWithAdvancedTableProps {
  userId: string;
}

export function BrandsListWithAdvancedTable({ userId }: BrandsListWithAdvancedTableProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    manufacturer: "",
  });

  const brands = useQuery(
    api.queries.brands.getBrands,
    userEmail ? { userEmail } : "skip"
  );
  const createBrand = useMutation(api.mutations.brands.createBrand);
  const updateBrand = useMutation(api.mutations.brands.updateBrand);
  const deleteBrand = useMutation(api.mutations.brands.deleteBrand);

  const handleOpenDialog = (brand?: any) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name || "",
        code: brand.code || "",
        description: brand.description || "",
        manufacturer: brand.manufacturer || "",
      });
    } else {
      setEditingBrand(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        manufacturer: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBrand(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      manufacturer: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await updateBrand({
          brandId: editingBrand._id,
          ...formData,
          userEmail: userEmail || undefined,
        });
        toast({
          title: "Success",
          description: "Brand updated successfully",
        });
      } else {
        await createBrand({
          ...formData,
          userEmail: userEmail || undefined,
        });
        toast({
          title: "Success",
          description: "Brand created successfully",
        });
      }
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save brand",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (brandId: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;
    try {
      await deleteBrand({
        brandId: brandId as any,
        userEmail: userEmail || undefined,
      });
      toast({
        title: "Success",
        description: "Brand deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete brand",
        variant: "destructive",
      });
    }
  };

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
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Search by name..."
      },
      size: 200,
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => row.getValue("code") || "-",
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by code..."
      },
      size: 120,
    },
    {
      accessorKey: "manufacturer",
      header: "Manufacturer",
      cell: ({ row }) => row.getValue("manufacturer") || "-",
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by manufacturer..."
      },
      size: 180,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.getValue("description") || "-"}</div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by description..."
      },
      size: 300,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const brand = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleOpenDialog(brand)}
              title="Edit Brand"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => handleDelete(brand._id)}
              title="Delete Brand"
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      size: 100,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Brand Directory</h2>
          <Badge variant="secondary" className="text-sm">
            {brands?.length || 0} brands
          </Badge>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </Button>
      </div>

      {brands === undefined ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading brands...
        </div>
      ) : (
        <AdvancedDataTable
          columns={columns}
          data={brands || []}
          tableId="brands"
          userId={userId}
          searchable={true}
          columnVisibility={true}
          pagination={true}
          rowSelection={true}
          enableGrouping={true}
          enableExport={true}
          exportFormats={["csv", "excel"]}
          enableAdvancedFilters={true}
          enableMultiSort={true}
          defaultPageSize={10}
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingBrand ? "Edit Brand" : "Create New Brand"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Brand Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Square Pharmaceuticals"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Brand Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., SQ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  placeholder="Manufacturer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brand description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

