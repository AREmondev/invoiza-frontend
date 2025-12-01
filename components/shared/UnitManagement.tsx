"use client";

import { useState } from 'react';
import { Ruler, Plus, Trash2, Edit, Save, X, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnitConversion, Product } from '@/types';
import { cn } from '@/lib/utils';

interface UnitManagementProps {
  productId?: string;
  product?: Product;
  units?: UnitConversion[];
  onUnitCreate?: (unit: Omit<UnitConversion, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => void;
  onUnitUpdate?: (id: string, updates: Partial<UnitConversion>) => void;
  onUnitDelete?: (id: string) => void;
  className?: string;
}

interface UnitFormData {
  fromUnit: string;
  toUnit: string;
  conversionFactor: number;
  isActive: boolean;
}

export function UnitManagement({
  productId,
  product,
  units = [],
  onUnitCreate,
  onUnitUpdate,
  onUnitDelete,
  className,
}: UnitManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitConversion | null>(null);
  const [formData, setFormData] = useState<UnitFormData>({
    fromUnit: '',
    toUnit: '',
    conversionFactor: 1,
    isActive: true,
  });

  // Get available units from product or from existing conversions
  const availableUnits = product?.units.map(u => u.unit) || 
    Array.from(new Set([
      ...units.map(u => u.fromUnit),
      ...units.map(u => u.toUnit),
    ]));

  const handleCreateUnit = () => {
    if (!formData.fromUnit || !formData.toUnit || formData.conversionFactor <= 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    if (formData.fromUnit === formData.toUnit) {
      alert('From unit and To unit cannot be the same');
      return;
    }

    // Check for duplicate conversion
    const duplicate = units.find(
      u => u.fromUnit === formData.fromUnit && 
           u.toUnit === formData.toUnit &&
           u.fromProductId === productId
    );
    if (duplicate) {
      alert('This unit conversion already exists');
      return;
    }

    const newUnit: Omit<UnitConversion, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
      fromUnit: formData.fromUnit,
      toUnit: formData.toUnit,
      fromProductId: productId || '',
      conversionFactor: formData.conversionFactor,
      isActive: formData.isActive,
    };

    if (onUnitCreate) {
      onUnitCreate(newUnit);
    }

    // Reset form
    setFormData({
      fromUnit: '',
      toUnit: '',
      conversionFactor: 1,
      isActive: true,
    });
    setShowCreateDialog(false);
  };

  const handleUpdateUnit = () => {
    if (!editingUnit) return;

    if (!formData.fromUnit || !formData.toUnit || formData.conversionFactor <= 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    if (onUnitUpdate) {
      onUnitUpdate(editingUnit.id, {
        fromUnit: formData.fromUnit,
        toUnit: formData.toUnit,
        conversionFactor: formData.conversionFactor,
        isActive: formData.isActive,
      });
    }

    setEditingUnit(null);
    setFormData({
      fromUnit: '',
      toUnit: '',
      conversionFactor: 1,
      isActive: true,
    });
  };

  const handleEditUnit = (unit: UnitConversion) => {
    setEditingUnit(unit);
    setFormData({
      fromUnit: unit.fromUnit,
      toUnit: unit.toUnit,
      conversionFactor: unit.conversionFactor,
      isActive: unit.isActive,
    });
    setShowCreateDialog(true);
  };

  const handleDeleteUnit = (unitId: string) => {
    if (confirm('Are you sure you want to delete this unit conversion?')) {
      if (onUnitDelete) {
        onUnitDelete(unitId);
      }
    }
  };

  const calculateReverseConversion = (factor: number) => {
    return factor !== 0 ? (1 / factor).toFixed(4) : 'N/A';
  };

  const getConversionExample = (fromUnit: string, toUnit: string, factor: number) => {
    return `1 ${fromUnit} = ${factor} ${toUnit}`;
  };

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Unit Management</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingUnit(null);
              setFormData({
                fromUnit: '',
                toUnit: '',
                conversionFactor: 1,
                isActive: true,
              });
              setShowCreateDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Conversion
          </Button>
        </div>

        {/* Product Info */}
        {product && (
          <Card className="p-4 bg-muted/50">
            <div className="space-y-2">
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-muted-foreground">
                Base Unit: {product.baseUnit} • Available Units: {product.units.length}
              </div>
            </div>
          </Card>
        )}

        {/* Units Table */}
        {units.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Ruler className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No unit conversions</p>
            <p className="text-sm mt-2">Create your first unit conversion to get started.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From Unit</TableHead>
                  <TableHead>To Unit</TableHead>
                  <TableHead>Conversion Factor</TableHead>
                  <TableHead>Example</TableHead>
                  <TableHead>Reverse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.fromUnit}</TableCell>
                    <TableCell className="font-medium">{unit.toUnit}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                        <span>{unit.conversionFactor}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getConversionExample(unit.fromUnit, unit.toUnit, unit.conversionFactor)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getConversionExample(unit.toUnit, unit.fromUnit, parseFloat(calculateReverseConversion(unit.conversionFactor)))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={unit.isActive ? 'default' : 'secondary'}>
                        {unit.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUnit(unit)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUnit(unit.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Conversion Examples */}
        {units.length > 0 && (
          <Card className="p-4 bg-accent/50">
            <h4 className="font-medium mb-3">Common Conversions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {units.filter(u => u.isActive).slice(0, 4).map((unit) => (
                <div key={unit.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-muted-foreground">
                    {getConversionExample(unit.fromUnit, unit.toUnit, unit.conversionFactor)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? 'Edit Unit Conversion' : 'Create Unit Conversion'}
            </DialogTitle>
            <DialogDescription>
              {editingUnit
                ? 'Update the unit conversion details.'
                : 'Create a new unit conversion. For example: 1 box = 12 pieces'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromUnit">From Unit</Label>
                <Select
                  value={formData.fromUnit}
                  onValueChange={(value) => setFormData({ ...formData, fromUnit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                    {availableUnits.length === 0 && (
                      <SelectItem value="custom" disabled>
                        No units available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toUnit">To Unit</Label>
                <Select
                  value={formData.toUnit}
                  onValueChange={(value) => setFormData({ ...formData, toUnit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                    {availableUnits.length === 0 && (
                      <SelectItem value="custom" disabled>
                        No units available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversionFactor">Conversion Factor</Label>
              <Input
                id="conversionFactor"
                type="number"
                min="0.0001"
                step="0.0001"
                value={formData.conversionFactor}
                onChange={(e) => setFormData({ ...formData, conversionFactor: parseFloat(e.target.value) || 1 })}
                placeholder="e.g., 12 (for 1 box = 12 pieces)"
              />
              <p className="text-xs text-muted-foreground">
                {formData.fromUnit && formData.toUnit && formData.conversionFactor > 0
                  ? getConversionExample(formData.fromUnit, formData.toUnit, formData.conversionFactor)
                  : 'Enter the conversion factor'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (enabled for use)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingUnit(null);
                setFormData({
                  fromUnit: '',
                  toUnit: '',
                  conversionFactor: 1,
                  isActive: true,
                });
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={editingUnit ? handleUpdateUnit : handleCreateUnit}>
              {editingUnit ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Conversion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

