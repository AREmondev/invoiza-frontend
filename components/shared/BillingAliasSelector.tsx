"use client";

import { useState, useEffect } from 'react';
import { User, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Customer, BillingAlias } from '@/types';
import { cn } from '@/lib/utils';

interface BillingAliasSelectorProps {
  customerId: string;
  selectedAliasId?: string;
  onAliasSelect: (aliasId: string) => void;
  allowCreate?: boolean;
  allowEdit?: boolean;
  className?: string;
}

export function BillingAliasSelector({
  customerId,
  selectedAliasId,
  onAliasSelect,
  allowCreate = true,
  allowEdit = true,
  className,
}: BillingAliasSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newAliasName, setNewAliasName] = useState('');
  const [editingAlias, setEditingAlias] = useState<BillingAlias | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  const { features } = useSettingsStore();
  
  // Mock customer data - will be replaced with actual customer from store
  const mockCustomer: Customer = {
    id: customerId,
    name: 'Sample Customer',
    email: 'customer@example.com',
    billingAliases: [
      {
        id: 'alias-1',
        customerId: customerId,
        name: 'Head Office',
        isActive: true,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        id: 'alias-2',
        customerId: customerId,
        name: 'Branch Office',
        isActive: true,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        id: 'alias-3',
        customerId: customerId,
        name: 'Warehouse',
        isActive: false,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      },
    ],
  } as Customer;

  useEffect(() => {
    // In real implementation, this would fetch customer from store
    setCustomer(mockCustomer);
  }, [customerId]);

  const activeAliases = customer?.billingAliases.filter(alias => alias.isActive) || [];
  const selectedAlias = activeAliases.find(alias => alias.id === selectedAliasId);
  const defaultAlias = activeAliases.find(alias => alias.isDefault);

  const handleCreateAlias = () => {
    if (!newAliasName.trim()) return;
    
    const newAlias: BillingAlias = {
      id: `alias-${Date.now()}`,
      customerId: customerId,
      name: newAliasName.trim(),
      isActive: true,
      isDefault: activeAliases.length === 0, // First alias is default
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user',
      updatedBy: 'current-user',
    };
    
    // In real implementation, this would update the customer in store
    if (customer) {
      const updatedCustomer = {
        ...customer,
        billingAliases: [...customer.billingAliases, newAlias],
      };
      setCustomer(updatedCustomer);
    }
    
    // Select the newly created alias
    onAliasSelect(newAlias.id);
    setNewAliasName('');
    setShowCreateDialog(false);
  };

  const handleEditAlias = () => {
    if (!editingAlias || !newAliasName.trim()) return;
    
    // In real implementation, this would update the alias in store
    if (customer) {
      const updatedCustomer = {
        ...customer,
        billingAliases: customer.billingAliases.map(alias =>
          alias.id === editingAlias.id
            ? { ...alias, name: newAliasName.trim(), updatedAt: new Date() }
            : alias
        ),
      };
      setCustomer(updatedCustomer);
    }
    
    setEditingAlias(null);
    setNewAliasName('');
    setShowEditDialog(false);
  };

  const handleSetDefault = (aliasId: string) => {
    // In real implementation, this would update the customer in store
    if (customer) {
      const updatedCustomer = {
        ...customer,
        billingAliases: customer.billingAliases.map(alias => ({
          ...alias,
          isDefault: alias.id === aliasId,
        })),
      };
      setCustomer(updatedCustomer);
    }
  };

  const handleToggleActive = (aliasId: string) => {
    // In real implementation, this would update the alias in store
    if (customer) {
      const updatedCustomer = {
        ...customer,
        billingAliases: customer.billingAliases.map(alias =>
          alias.id === aliasId
            ? { ...alias, isActive: !alias.isActive, updatedAt: new Date() }
            : alias
        ),
      };
      setCustomer(updatedCustomer);
      
      // If we're disabling the currently selected alias, clear selection
      if (selectedAliasId === aliasId && customer.billingAliases.find(a => a.id === aliasId)?.isActive) {
        onAliasSelect('');
      }
    }
  };

  const handleDeleteAlias = (aliasId: string) => {
    // In real implementation, this would delete the alias from store
    if (customer) {
      const updatedCustomer = {
        ...customer,
        billingAliases: customer.billingAliases.filter(alias => alias.id !== aliasId),
      };
      setCustomer(updatedCustomer);
      
      // If we're deleting the currently selected alias, clear selection
      if (selectedAliasId === aliasId) {
        onAliasSelect('');
      }
    }
  };

  if (!features.billingAliases) {
    return null; // Feature is disabled
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Billing Name</label>
          {allowCreate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Alias
            </Button>
          )}
        </div>
        
        <Select value={selectedAliasId || '__none__'} onValueChange={(value) => onAliasSelect(value === '__none__' ? undefined : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select billing name">
              {selectedAlias ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{selectedAlias.name}</span>
                  {selectedAlias.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Use customer name</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Use customer name ({customer?.name})</span>
              </div>
            </SelectItem>
            
            {activeAliases.map((alias) => (
              <SelectItem key={alias.id} value={alias.id}>
                <div className="flex items-center gap-2 justify-between w-full">
                  <span>{alias.name}</span>
                  {alias.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Alias Management */}
      {allowEdit && activeAliases.length > 0 && (
        <Card className="p-3">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Manage Aliases</div>
            
            <div className="space-y-1">
              {activeAliases.map((alias) => (
                <div
                  key={alias.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded border",
                    selectedAliasId === alias.id && "border-primary bg-accent/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{alias.name}</span>
                    {alias.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!alias.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(alias.id)}
                        title="Set as default"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingAlias(alias);
                        setNewAliasName(alias.name);
                        setShowEditDialog(true);
                      }}
                      title="Edit alias"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(alias.id)}
                      title="Disable alias"
                      className="text-muted-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Create Alias Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Billing Alias</DialogTitle>
            <DialogDescription>
              Create a new billing name alias for this customer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Alias Name</label>
              <Input
                value={newAliasName}
                onChange={(e) => setNewAliasName(e.target.value)}
                placeholder="Enter alias name (e.g., Head Office, Branch 1)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setNewAliasName('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateAlias} disabled={!newAliasName.trim()}>
              Create Alias
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Alias Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Billing Alias</DialogTitle>
            <DialogDescription>
              Update the billing name alias.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Alias Name</label>
              <Input
                value={newAliasName}
                onChange={(e) => setNewAliasName(e.target.value)}
                placeholder="Enter alias name"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setEditingAlias(null);
              setNewAliasName('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditAlias} disabled={!newAliasName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}