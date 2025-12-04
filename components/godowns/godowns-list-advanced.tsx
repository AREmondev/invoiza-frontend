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

interface GodownsListWithAdvancedTableProps {
  userId: string;
}

export function GodownsListWithAdvancedTable({ userId }: GodownsListWithAdvancedTableProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGodown, setEditingGodown] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    location: "",
    description: "",
  });

  const godowns = useQuery(
    api.queries.godowns.getGodowns,
    userEmail ? { userEmail } : "skip"
  );
  const createGodown = useMutation(api.mutations.godowns.createGodown);
  const updateGodown = useMutation(api.mutations.godowns.updateGodown);
  const deleteGodown = useMutation(api.mutations.godowns.deleteGodown);

  const handleOpenDialog = (godown?: any) => {
    if (godown) {
      setEditingGodown(godown);
      setFormData({
        name: godown.name || "",
        code: godown.code || "",
        location: godown.location || "",
        description: godown.description || "",
      });
    } else {
      setEditingGodown(null);
      setFormData({
        name: "",
        code: "",
        location: "",
        description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingGodown(null);
    setFormData({
      name: "",
      code: "",
      location: "",
      description: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGodown) {
        await updateGodown({
          godownId: editingGodown._id,
          ...formData,
          userEmail: userEmail || undefined,
        });
        toast({
          title: "Success",
          description: "Godown updated successfully",
        });
      } else {
        await createGodown({
          ...formData,
          userEmail: userEmail || undefined,
        });
        toast({
          title: "Success",
          description: "Godown created successfully",
        });
      }
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save godown",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (godownId: string) => {
    if (!confirm("Are you sure you want to delete this godown?")) return;
    try {
      await deleteGodown({
        godownId: godownId as any,
        userEmail: userEmail || undefined,
      });
      toast({
        title: "Success",
        description: "Godown deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete godown",
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
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => row.getValue("location") || "-",
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by location..."
      },
      size: 200,
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
        const godown = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleOpenDialog(godown)}
              title="Edit Godown"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => handleDelete(godown._id)}
              title="Delete Godown"
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
          <h2 className="text-lg font-semibold">Godown Directory</h2>
          <Badge variant="secondary" className="text-sm">
            {godowns?.length || 0} godowns
          </Badge>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Godown
        </Button>
      </div>

      {godowns === undefined ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading godowns...
        </div>
      ) : (
        <AdvancedDataTable
          columns={columns}
          data={godowns || []}
          tableId="godowns"
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
                {editingGodown ? "Edit Godown" : "Create New Godown"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Godown Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Main Store"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Godown Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., MS-01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., Ground Floor, Room 101"
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
                  placeholder="Godown description"
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

