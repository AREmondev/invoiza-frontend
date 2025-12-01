"use client";

import { useState } from 'react';
import { Plus, DollarSign, Percent, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSettingsStore } from '@/store/useSettingsStore';
import { AdditionalCharge, AppliedAdditionalCharge } from '@/types';
import { cn } from '@/lib/utils';

interface ChargesSelectorProps {
  appliedCharges: AppliedAdditionalCharge[];
  onChargesChange: (charges: AppliedAdditionalCharge[]) => void;
  lineItemIds?: string[]; // For per-line charges
  className?: string;
}

export function ChargesSelector({ 
  appliedCharges, 
  onChargesChange, 
  lineItemIds,
  className 
}: ChargesSelectorProps) {
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [selectedChargeType, setSelectedChargeType] = useState<'per_line' | 'global'>('global');
  
  const { additionalCharges, getActiveAdditionalCharges, getPerLineCharges, getGlobalCharges } = useSettingsStore();
  
  const availableCharges = getActiveAdditionalCharges();
  const perLineCharges = getPerLineCharges();
  const globalCharges = getGlobalCharges();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const handleChargeToggle = (chargeId: string, enabled: boolean) => {
    if (enabled) {
      // Add charge
      const charge = availableCharges.find(c => c.id === chargeId);
      if (charge) {
        const newCharge: AppliedAdditionalCharge = {
          id: `applied-${Date.now()}`,
          invoiceId: '', // Will be set when invoice is created
          additionalChargeId: chargeId,
          name: charge.name,
          type: charge.type,
          value: charge.value,
          applyTo: selectedChargeType,
          amountCents: 0, // Will be calculated based on context
          isTaxable: charge.isTaxable,
          lineItemIds: selectedChargeType === 'per_line' ? lineItemIds : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'current-user', // Will be set from auth
          updatedBy: 'current-user',
        };
        
        onChargesChange([...appliedCharges, newCharge]);
      }
    } else {
      // Remove charge
      onChargesChange(appliedCharges.filter(c => c.additionalChargeId !== chargeId));
    }
  };

  const handleChargeValueChange = (chargeId: string, newValue: number) => {
    onChargesChange(
      appliedCharges.map(charge =>
        charge.id === chargeId
          ? { ...charge, value: newValue }
          : charge
      )
    );
  };

  const calculateChargeAmount = (charge: AppliedAdditionalCharge, subtotal: number) => {
    if (charge.type === 'percentage') {
      return Math.round(subtotal * (charge.value / 100));
    } else {
      return Math.round(charge.value * 100); // Convert dollars to cents
    }
  };

  const getTotalCharges = () => {
    return appliedCharges.reduce((sum, charge) => sum + charge.amountCents, 0);
  };

  const ChargeIcon = ({ type }: { type: 'percentage' | 'fixed' }) => {
    return type === 'percentage' ? 
      <Percent className="h-4 w-4" /> : 
      <DollarSign className="h-4 w-4" />;
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Additional Charges</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Total: {formatCurrency(getTotalCharges())}
            </Badge>
            
            <Popover open={showAddCharge} onOpenChange={setShowAddCharge}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Charge
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <div className="p-4 space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Charge Type</label>
                    <Select value={selectedChargeType} onValueChange={(value: any) => setSelectedChargeType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global (Invoice Level)</SelectItem>
                        <SelectItem value="per_line">Per Line Item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Available Charges</label>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {selectedChargeType === 'per_line' ? (
                        perLineCharges.map((charge) => (
                          <div
                            key={charge.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-accent/50",
                              appliedCharges.some(c => c.additionalChargeId === charge.id) && "bg-accent"
                            )}
                            onClick={() => handleChargeToggle(charge.id, !appliedCharges.some(c => c.additionalChargeId === charge.id))}
                          >
                            <div className="flex items-center gap-2">
                              <ChargeIcon type={charge.type} />
                              <div>
                                <div className="font-medium text-sm">{charge.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {charge.type === 'percentage' ? `${charge.value}%` : formatCurrency(charge.value * 100)}
                                </div>
                              </div>
                            </div>
                            <Switch
                              checked={appliedCharges.some(c => c.additionalChargeId === charge.id)}
                              onChange={() => {}} // Handled by parent click
                            />
                          </div>
                        ))
                      ) : (
                        globalCharges.map((charge) => (
                          <div
                            key={charge.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-accent/50",
                              appliedCharges.some(c => c.additionalChargeId === charge.id) && "bg-accent"
                            )}
                            onClick={() => handleChargeToggle(charge.id, !appliedCharges.some(c => c.additionalChargeId === charge.id))}
                          >
                            <div className="flex items-center gap-2">
                              <ChargeIcon type={charge.type} />
                              <div>
                                <div className="font-medium text-sm">{charge.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {charge.type === 'percentage' ? `${charge.value}%` : formatCurrency(charge.value * 100)}
                                </div>
                              </div>
                            </div>
                            <Switch
                              checked={appliedCharges.some(c => c.additionalChargeId === charge.id)}
                              onChange={() => {}} // Handled by parent click
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Applied Charges */}
        {appliedCharges.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Applied Charges</label>
            <div className="space-y-2">
              {appliedCharges.map((charge) => (
                <Card key={charge.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ChargeIcon type={charge.type} />
                      <div>
                        <div className="font-medium">{charge.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {charge.applyTo === 'per_line' ? 'Per Line' : 'Global'} • 
                          {charge.type === 'percentage' ? `${charge.value}%` : formatCurrency(charge.value * 100)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {formatCurrency(charge.amountCents)}
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onChargesChange(appliedCharges.filter(c => c.id !== charge.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {charge.type === 'percentage' && (
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={charge.value}
                        onChange={(e) => handleChargeValueChange(charge.id, parseFloat(e.target.value) || 0)}
                        className="w-20 text-sm"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {appliedCharges.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No additional charges applied</p>
            <p className="text-xs mt-1">Click "Add Charge" to apply charges</p>
          </div>
        )}
      </div>
    </Card>
  );
}