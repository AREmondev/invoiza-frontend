"use client";

import { useState, useEffect } from 'react';
import { Plus, DollarSign, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { AppliedAdditionalCharge } from '@/types';
import { cn } from '@/lib/utils';

interface ChargesSelectorProps {
  appliedCharges: AppliedAdditionalCharge[];
  onChargesChange: (charges: AppliedAdditionalCharge[]) => void;
  lineItemIds?: string[]; // For per-line charges
  className?: string;
  hideCard?: boolean; // If true, don't render Card wrapper
}

export function ChargesSelector({ 
  appliedCharges, 
  onChargesChange, 
  lineItemIds,
  className,
  hideCard = false
}: ChargesSelectorProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newChargeName, setNewChargeName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Fetch additional charges from backend
  const charges = useQuery(
    api.queries.additionalCharges.getAdditionalCharges,
    userEmail ? { userEmail } : "skip"
  );
  
  const createCharge = useMutation(api.mutations.additionalCharges.createAdditionalCharge);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const handleCreateCharge = async () => {
    if (!newChargeName.trim()) {
      toast({
        title: "Error",
        description: "Charge name is required",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createCharge({
        name: newChargeName.trim(),
        userEmail: userEmail || undefined,
      });
      
      toast({
        title: "Success",
        description: "Additional charge created successfully",
      });
      
      setNewChargeName('');
      setShowCreateDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create charge",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddCharge = (chargeId: string, chargeName: string) => {
    // Check if charge is already applied
    if (appliedCharges.some(c => c.additionalChargeId === chargeId)) {
      return;
    }

    const newCharge: AppliedAdditionalCharge = {
      id: `applied-${Date.now()}`,
      invoiceId: '',
      additionalChargeId: chargeId,
      name: chargeName,
      type: 'fixed', // Default to fixed, user will set amount
      value: 0,
      applyTo: 'global',
      amountCents: 0, // User will set this
      isTaxable: false,
      lineItemIds: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user',
      updatedBy: 'current-user',
    };
    
    onChargesChange([...appliedCharges, newCharge]);
  };

  const handleRemoveCharge = (chargeId: string) => {
    onChargesChange(appliedCharges.filter(c => c.id !== chargeId));
  };

  const handleAmountChange = (chargeId: string, amount: number) => {
    onChargesChange(
      appliedCharges.map(charge =>
        charge.id === chargeId
          ? { ...charge, amountCents: Math.round(amount * 100) } // Convert to cents
          : charge
      )
    );
  };

  const getTotalCharges = () => {
    return appliedCharges.reduce((sum, charge) => sum + charge.amountCents, 0);
  };

  const availableCharges = charges?.filter(c => c.isActive) || [];
  const appliedChargeIds = appliedCharges.map(c => c.additionalChargeId);

  const content = (
    <div className={cn("space-y-4", !hideCard && "p-6")}>
      {/* Header */}
      {!hideCard && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Additional Charges</h3>
            <Badge variant="outline">
              Total: {formatCurrency(getTotalCharges())}
            </Badge>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Charge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Additional Charge</DialogTitle>
                <DialogDescription>
                  Create a new additional charge. You'll set the amount when applying it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Charge Name *</Label>
                  <Input
                    placeholder="e.g., Delivery Fee, Service Charge"
                    value={newChargeName}
                    onChange={(e) => setNewChargeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateCharge();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCharge} disabled={isCreating || !newChargeName.trim()}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Add Charge Selector */}
        <div className="space-y-2">
          <Label>Select Charge to Add</Label>
          <Select
            value=""
            onValueChange={(value) => {
              const charge = availableCharges.find(c => c._id === value);
              if (charge) {
                handleAddCharge(charge._id, charge.name);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a charge to add" />
            </SelectTrigger>
            <SelectContent>
              {availableCharges
                .filter(c => !appliedChargeIds.includes(c._id))
                .map((charge) => (
                  <SelectItem key={charge._id} value={charge._id}>
                    {charge.name}
                  </SelectItem>
                ))}
              {availableCharges.filter(c => !appliedChargeIds.includes(c._id)).length === 0 && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No available charges. Create one to get started.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Applied Charges - Single Row Layout */}
        {appliedCharges.length > 0 && (
          <div className="space-y-2">
            <Label>Applied Charges</Label>
            <div className="space-y-2">
              {appliedCharges.map((charge) => {
                const chargeData = availableCharges.find(c => c._id === charge.additionalChargeId);
                return (
                  <div key={charge.id} className="flex items-center gap-3 p-2 border rounded-lg bg-white">
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-medium text-sm">{charge.name}</div>
                    </div>
                    <div className="flex items-center gap-2 w-32">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={(charge.amountCents / 100).toFixed(2)}
                        onChange={(e) => handleAmountChange(charge.id, parseFloat(e.target.value) || 0)}
                        className="text-right"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="w-10 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCharge(charge.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {appliedCharges.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No additional charges applied</p>
            <p className="text-xs mt-1">Select a charge above to add it</p>
          </div>
        )}
      </div>
  );

  if (hideCard) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={cn("p-6 shadow-sm", className)}>
      {content}
    </Card>
  );
}
