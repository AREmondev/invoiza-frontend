"use client";

import { useState } from 'react';
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { AdvancedDataTable, AdvancedColumnDef } from '@/components/ui/advanced-data-table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash, Ruler, ArrowRight } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UnitsListWithAdvancedTableProps {
  userId: string;
}

export function UnitsListWithAdvancedTable({ userId }: UnitsListWithAdvancedTableProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [isConversionDialogOpen, setIsConversionDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [editingConversion, setEditingConversion] = useState<any>(null);
  const [unitFormData, setUnitFormData] = useState({
    name: "",
    abbreviation: "",
    description: "",
    isBaseUnit: false,
  });
  const [conversionFormData, setConversionFormData] = useState({
    baseUnitId: "",
    secondaryUnitId: "",
    conversionFactor: 1,
    description: "",
  });

  const units = useQuery(
    api.queries.units.getUnits,
    userEmail ? { userEmail } : "skip"
  );
  const conversions = useQuery(
    api.queries.units.getUnitConversions,
    userEmail ? { userEmail } : "skip"
  );
  const createUnit = useMutation(api.mutations.units.createUnit);
  const updateUnit = useMutation(api.mutations.units.updateUnit);
  const deleteUnit = useMutation(api.mutations.units.deleteUnit);
  const createUnitConversion = useMutation(
    api.mutations.units.createUnitConversion
  );
  const updateUnitConversion = useMutation(
    api.mutations.units.updateUnitConversion
  );
  const deleteUnitConversion = useMutation(
    api.mutations.units.deleteUnitConversion
  );

  const handleOpenUnitDialog = (unit?: any) => {
    if (unit) {
      setEditingUnit(unit);
      setUnitFormData({
        name: unit.name || "",
        abbreviation: unit.abbreviation || "",
        description: unit.description || "",
        isBaseUnit: unit.isBaseUnit || false,
      });
    } else {
      setEditingUnit(null);
      setUnitFormData({
        name: "",
        abbreviation: "",
        description: "",
        isBaseUnit: false,
      });
    }
    setIsUnitDialogOpen(true);
  };

  const handleOpenConversionDialog = (conversion?: any) => {
    if (conversion) {
      setEditingConversion(conversion);
      setConversionFormData({
        baseUnitId: conversion.baseUnitId || "",
        secondaryUnitId: conversion.secondaryUnitId || "",
        conversionFactor: conversion.conversionFactor || 1,
        description: conversion.description || "",
      });
    } else {
      setEditingConversion(null);
      setConversionFormData({
        baseUnitId: "",
        secondaryUnitId: "",
        conversionFactor: 1,
        description: "",
      });
    }
    setIsConversionDialogOpen(true);
  };

  const handleCloseUnitDialog = () => {
    setIsUnitDialogOpen(false);
    setEditingUnit(null);
    setUnitFormData({
      name: "",
      abbreviation: "",
      description: "",
      isBaseUnit: false,
    });
  };

  const handleCloseConversionDialog = () => {
    setIsConversionDialogOpen(false);
    setEditingConversion(null);
    setConversionFormData({
      baseUnitId: "",
      secondaryUnitId: "",
      conversionFactor: 1,
      description: "",
    });
  };

  const handleSubmitUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUnit) {
        await updateUnit({
          unitId: editingUnit._id,
          ...unitFormData,
          userEmail: userEmail || undefined,
        });
        toast({
          title: "Success",
          description: "Unit updated successfully",
        });
      } else {
        await createUnit({
          ...unitFormData,
          userEmail: userEmail || undefined,
        });
        toast({
          title: "Success",
          description: "Unit created successfully",
        });
      }
      handleCloseUnitDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save unit",
        variant: "destructive",
      });
    }
  };

  const handleSubmitConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversionFormData.baseUnitId || !conversionFormData.secondaryUnitId) {
      toast({
        title: "Error",
        description: "Please select both base and secondary units",
        variant: "destructive",
      });
      return;
    }
    if (conversionFormData.baseUnitId === conversionFormData.secondaryUnitId) {
      toast({
        title: "Error",
        description: "Base unit and secondary unit cannot be the same",
        variant: "destructive",
      });
      return;
    }
    try {
      if (editingConversion) {
        await updateUnitConversion({
          conversionId: editingConversion._id,
          conversionFactor: conversionFormData.conversionFactor,
          description: conversionFormData.description,
          userEmail: userEmail || undefined,
        });
        toast({
          title: "Success",
          description: "Unit conversion updated successfully",
        });
      } else {
        await createUnitConversion({
          baseUnitId: conversionFormData.baseUnitId as any,
          secondaryUnitId: conversionFormData.secondaryUnitId as any,
          conversionFactor: conversionFormData.conversionFactor,
          description: conversionFormData.description,
          userEmail: userEmail || undefined,
        });
        toast({
          title: "Success",
          description: "Unit conversion created successfully",
        });
      }
      handleCloseConversionDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save unit conversion",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("Are you sure you want to delete this unit?")) return;
    try {
      await deleteUnit({
        unitId: unitId as any,
        userEmail: userEmail || undefined,
      });
      toast({
        title: "Success",
        description: "Unit deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete unit",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConversion = async (conversionId: string) => {
    if (!confirm("Are you sure you want to delete this conversion?")) return;
    try {
      await deleteUnitConversion({
        conversionId: conversionId as any,
        userEmail: userEmail || undefined,
      });
      toast({
        title: "Success",
        description: "Unit conversion deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete conversion",
        variant: "destructive",
      });
    }
  };

  const getTypeBadge = (isBaseUnit: boolean) => {
    if (isBaseUnit) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Base Unit</Badge>;
    }
    return <Badge variant="secondary">Secondary</Badge>;
  };

  // Units columns
  const unitsColumns: AdvancedColumnDef<any>[] = [
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
      accessorKey: "abbreviation",
      header: "Abbreviation",
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by abbreviation..."
      },
      size: 150,
    },
    {
      accessorKey: "isBaseUnit",
      header: "Type",
      cell: ({ row }) => getTypeBadge(row.getValue("isBaseUnit")),
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "select",
        options: [
          { label: "Base Unit", value: "true" },
          { label: "Secondary", value: "false" }
        ],
        placeholder: "Filter by type"
      },
      size: 120,
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
      size: 250,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const unit = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleOpenUnitDialog(unit)}
              title="Edit Unit"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => handleDeleteUnit(unit._id)}
              title="Delete Unit"
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

  // Conversions columns
  const conversionsColumns: AdvancedColumnDef<any>[] = [
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
      accessorKey: "baseUnit",
      header: "Base Unit",
      cell: ({ row }) => {
        const conv = row.original;
        return <div className="font-medium">{conv.baseUnit?.name || "-"}</div>;
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by base unit..."
      },
      size: 150,
    },
    {
      accessorKey: "secondaryUnit",
      header: "Secondary Unit",
      cell: ({ row }) => {
        const conv = row.original;
        return <div className="font-medium">{conv.secondaryUnit?.name || "-"}</div>;
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "text",
        placeholder: "Filter by secondary unit..."
      },
      size: 150,
    },
    {
      accessorKey: "conversionFactor",
      header: "Conversion",
      cell: ({ row }) => {
        const conv = row.original;
        return (
          <span className="font-semibold">
            1 {conv.baseUnit?.abbreviation || ""} = {conv.conversionFactor}{" "}
            {conv.secondaryUnit?.abbreviation || ""}
          </span>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterConfig: {
        type: "range",
        placeholder: "Filter by conversion factor"
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
      size: 250,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const conversion = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleOpenConversionDialog(conversion)}
              title="Edit Conversion"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => handleDeleteConversion(conversion._id)}
              title="Delete Conversion"
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
          <h2 className="text-lg font-semibold">Units & Conversions</h2>
          <Badge variant="secondary" className="text-sm">
            {units?.length || 0} units, {conversions?.length || 0} conversions
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenConversionDialog()}>
            <ArrowRight className="mr-2 h-4 w-4" />
            Add Conversion
          </Button>
          <Button onClick={() => handleOpenUnitDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Unit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="units" className="space-y-4">
        <TabsList>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
        </TabsList>

        <TabsContent value="units">
          {units === undefined ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading units...
            </div>
          ) : (
            <AdvancedDataTable
              columns={unitsColumns}
              data={units || []}
              tableId="units"
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
        </TabsContent>

        <TabsContent value="conversions">
          {conversions === undefined ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading conversions...
            </div>
          ) : (
            <AdvancedDataTable
              columns={conversionsColumns}
              data={conversions || []}
              tableId="conversions"
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
        </TabsContent>
      </Tabs>

      {/* Unit Dialog */}
      <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmitUnit}>
            <DialogHeader>
              <DialogTitle>
                {editingUnit ? "Edit Unit" : "Create New Unit"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Unit Name *</Label>
                <Input
                  id="name"
                  value={unitFormData.name}
                  onChange={(e) =>
                    setUnitFormData({ ...unitFormData, name: e.target.value })
                  }
                  placeholder="e.g., Box, Piece, Strip, Bottle"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abbreviation">Abbreviation *</Label>
                <Input
                  id="abbreviation"
                  value={unitFormData.abbreviation}
                  onChange={(e) =>
                    setUnitFormData({
                      ...unitFormData,
                      abbreviation: e.target.value,
                    })
                  }
                  placeholder="e.g., box, pc, strip, bottle"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={unitFormData.description}
                  onChange={(e) =>
                    setUnitFormData({
                      ...unitFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Unit description"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isBaseUnit"
                  checked={unitFormData.isBaseUnit}
                  onChange={(e) =>
                    setUnitFormData({
                      ...unitFormData,
                      isBaseUnit: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isBaseUnit">Mark as Base Unit</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseUnitDialog}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Conversion Dialog */}
      <Dialog
        open={isConversionDialogOpen}
        onOpenChange={setIsConversionDialogOpen}
      >
        <DialogContent>
          <form onSubmit={handleSubmitConversion}>
            <DialogHeader>
              <DialogTitle>
                {editingConversion
                  ? "Edit Conversion"
                  : "Create New Unit Conversion"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="baseUnitId">Base Unit *</Label>
                <select
                  id="baseUnitId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={conversionFormData.baseUnitId}
                  onChange={(e) =>
                    setConversionFormData({
                      ...conversionFormData,
                      baseUnitId: e.target.value,
                    })
                  }
                  required
                  disabled={!!editingConversion}
                >
                  <option value="">Select base unit</option>
                  {units?.map((unit: any) => (
                    <option key={unit._id} value={unit._id}>
                      {unit.name} ({unit.abbreviation})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryUnitId">Secondary Unit *</Label>
                <select
                  id="secondaryUnitId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={conversionFormData.secondaryUnitId}
                  onChange={(e) =>
                    setConversionFormData({
                      ...conversionFormData,
                      secondaryUnitId: e.target.value,
                    })
                  }
                  required
                  disabled={!!editingConversion}
                >
                  <option value="">Select secondary unit</option>
                  {units
                    ?.filter(
                      (unit: any) => unit._id !== conversionFormData.baseUnitId
                    )
                    .map((unit: any) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.name} ({unit.abbreviation})
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conversionFactor">
                  Conversion Factor * (How many secondary units = 1 base unit)
                </Label>
                <Input
                  id="conversionFactor"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={conversionFormData.conversionFactor}
                  onChange={(e) =>
                    setConversionFormData({
                      ...conversionFormData,
                      conversionFactor: parseFloat(e.target.value) || 1,
                    })
                  }
                  placeholder="e.g., 25 (for 1 box = 25 pcs)"
                  required
                />
                {conversionFormData.baseUnitId &&
                  conversionFormData.secondaryUnitId && (
                    <p className="text-sm text-muted-foreground">
                      1{" "}
                      {
                        units?.find(
                          (u: any) =>
                            u._id === conversionFormData.baseUnitId
                        )?.abbreviation
                      }{" "}
                      = {conversionFormData.conversionFactor}{" "}
                      {
                        units?.find(
                          (u: any) =>
                            u._id === conversionFormData.secondaryUnitId
                        )?.abbreviation
                      }
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={conversionFormData.description}
                  onChange={(e) =>
                    setConversionFormData({
                      ...conversionFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="e.g., 1 Box = 25 Pieces"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseConversionDialog}
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

