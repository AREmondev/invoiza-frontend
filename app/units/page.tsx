"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { Plus, Edit, Trash2, Ruler, ArrowRight } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function UnitsPage() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Units & Conversions</h1>
          <p className="text-muted-foreground">
            Manage units and unit conversions for pharmacy products
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenConversionDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Conversion
          </Button>
          <Button onClick={() => handleOpenUnitDialog()}>
            <Plus className="h-4 w-4 mr-2" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                All Units
              </CardTitle>
            </CardHeader>
            <CardContent>
              {units === undefined ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading units...
                </div>
              ) : units.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No units found. Create your first unit to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Abbreviation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit: any) => (
                      <TableRow key={unit._id}>
                        <TableCell className="font-medium">
                          {unit.name}
                        </TableCell>
                        <TableCell>{unit.abbreviation}</TableCell>
                        <TableCell>
                          {unit.isBaseUnit ? (
                            <Badge variant="default">Base Unit</Badge>
                          ) : (
                            <Badge variant="secondary">Secondary</Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {unit.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenUnitDialog(unit)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUnit(unit._id)}
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
        </TabsContent>

        <TabsContent value="conversions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Unit Conversions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversions === undefined ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading conversions...
                </div>
              ) : conversions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No conversions found. Create your first conversion to get
                  started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Base Unit</TableHead>
                      <TableHead>Secondary Unit</TableHead>
                      <TableHead>Conversion</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversions.map((conv: any) => (
                      <TableRow key={conv._id}>
                        <TableCell className="font-medium">
                          {conv.baseUnit?.name || "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {conv.secondaryUnit?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            1 {conv.baseUnit?.abbreviation || ""} ={" "}
                            {conv.conversionFactor}{" "}
                            {conv.secondaryUnit?.abbreviation || ""}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {conv.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenConversionDialog(conv)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteConversion(conv._id)}
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

