"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { Plus, Edit, Trash2, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export default function GodownsPage() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Godowns / Storage Rooms</h1>
          <p className="text-muted-foreground">
            Manage storage locations for inventory
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Godown
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            All Godowns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {godowns === undefined ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading godowns...
            </div>
          ) : godowns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No godowns found. Create your first godown to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {godowns.map((godown: any) => (
                  <TableRow key={godown._id}>
                    <TableCell className="font-medium">{godown.name}</TableCell>
                    <TableCell>{godown.code || "-"}</TableCell>
                    <TableCell>{godown.location || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {godown.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(godown)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(godown._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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

