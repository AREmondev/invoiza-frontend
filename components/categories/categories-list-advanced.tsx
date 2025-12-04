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

interface CategoriesListWithAdvancedTableProps {
  userId: string;
}

export function CategoriesListWithAdvancedTable({ userId }: CategoriesListWithAdvancedTableProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    parentId: undefined as string | undefined,
  });

  const categories = useQuery(
    api.queries.categories.getCategories,
    userEmail ? { userEmail } : "skip"
  );
  const createCategory = useMutation(api.mutations.categories.createCategory);
  const updateCategory = useMutation(api.mutations.categories.updateCategory);
  const deleteCategory = useMutation(api.mutations.categories.deleteCategory);

  const handleOpenDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || "",
        code: category.code || "",
        description: category.description || "",
        parentId: category.parentId || undefined,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        parentId: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      parentId: undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory({
          categoryId: editingCategory._id,
          ...formData,
          parentId: formData.parentId ? (formData.parentId as any) : undefined,
          userEmail: userEmail || undefined,
        });
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        await createCategory({
          ...formData,
          parentId: formData.parentId ? (formData.parentId as any) : undefined,
          userEmail: userEmail || undefined,
        });
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory({
        categoryId: categoryId as any,
        userEmail: userEmail || undefined,
      });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
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
      accessorKey: "parentId",
      header: "Parent Category",
      cell: ({ row }) => {
        const category = row.original;
        const parentCategory = categories?.find(
          (c: any) => c._id === category.parentId
        );
        return parentCategory?.name || "-";
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by parent..."
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
        const category = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleOpenDialog(category)}
              title="Edit Category"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => handleDelete(category._id)}
              title="Delete Category"
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
          <h2 className="text-lg font-semibold">Category Directory</h2>
          <Badge variant="secondary" className="text-sm">
            {categories?.length || 0} categories
          </Badge>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {categories === undefined ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading categories...
        </div>
      ) : (
        <AdvancedDataTable
          columns={columns}
          data={categories || []}
          tableId="categories"
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
                {editingCategory ? "Edit Category" : "Create New Category"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Antibiotics"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Category Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., ANT"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Category</Label>
                <select
                  id="parentId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.parentId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentId: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">None</option>
                  {categories
                    ?.filter((c: any) => c._id !== editingCategory?._id)
                    .map((cat: any) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Category description"
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

