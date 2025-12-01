"use client";

import { useState } from 'react';
import { User, Percent, DollarSign, Calculator, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CommissionAgent } from '@/types';
import { cn } from '@/lib/utils';

interface CommissionAgentSelectorProps {
  selectedAgentId?: string;
  onAgentSelect: (agentId: string | undefined) => void;
  totalProfitCents?: number; // For profit-based commission calculation
  totalAmountCents?: number; // For account-based commission calculation
  allowCreate?: boolean;
  className?: string;
}

// Mock commission agents - will be replaced with store data
const mockCommissionAgents: CommissionAgent[] = [
  {
    id: 'agent-1',
    name: 'John Referral',
    email: 'john@referral.com',
    phone: '+1-555-0101',
    commissionType: 'profit',
    commissionValue: 10, // 10% of profit
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system',
    auditLogs: [],
  },
  {
    id: 'agent-2',
    name: 'Jane Partner',
    email: 'jane@partner.com',
    phone: '+1-555-0102',
    commissionType: 'account',
    commissionValue: 5, // 5% of total amount
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system',
    auditLogs: [],
  },
  {
    id: 'agent-3',
    name: 'Fixed Rate Agent',
    email: 'fixed@agent.com',
    commissionType: 'fixed',
    commissionValue: 5000, // $50.00 fixed
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system',
    auditLogs: [],
  },
];

export function CommissionAgentSelector({
  selectedAgentId,
  onAgentSelect,
  totalProfitCents = 0,
  totalAmountCents = 0,
  allowCreate = false,
  className,
}: CommissionAgentSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [agents] = useState<CommissionAgent[]>(mockCommissionAgents);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const calculateCommission = (agent: CommissionAgent): number => {
    if (!agent) return 0;

    switch (agent.commissionType) {
      case 'profit':
        return Math.round((totalProfitCents * agent.commissionValue) / 100);
      case 'account':
        return Math.round((totalAmountCents * agent.commissionValue) / 100);
      case 'fixed':
        return agent.commissionValue;
      default:
        return 0;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatCommissionType = (type: string) => {
    switch (type) {
      case 'profit':
        return 'Profit %';
      case 'account':
        return 'Account %';
      case 'fixed':
        return 'Fixed';
      default:
        return type;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label>Commission Agent</Label>
        {allowCreate && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Commission Agent</DialogTitle>
                <DialogDescription>
                  Add a new commission agent to the system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input placeholder="Agent name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="agent@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" placeholder="+1-555-0100" />
                </div>
                <div className="space-y-2">
                  <Label>Commission Type *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profit">Profit Percentage</SelectItem>
                      <SelectItem value="account">Account Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Commission Value *</Label>
                  <Input type="number" step="0.01" placeholder="0.00" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Create Agent
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Select value={selectedAgentId || ''} onValueChange={(value) => onAgentSelect(value || undefined)}>
        <SelectTrigger>
          <SelectValue placeholder="Select commission agent (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">None</SelectItem>
          {agents.filter(a => a.isActive).map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{agent.name}</span>
                <Badge variant="outline" className="text-xs">
                  {formatCommissionType(agent.commissionType)}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedAgent && (
        <Card className="p-3 bg-accent/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedAgent.name}</span>
              </div>
              <Badge variant="outline">
                {formatCommissionType(selectedAgent.commissionType)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>{' '}
                <span className="font-medium">
                  {selectedAgent.commissionType === 'profit' && (
                    <span className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      {selectedAgent.commissionValue}% of Profit
                    </span>
                  )}
                  {selectedAgent.commissionType === 'account' && (
                    <span className="flex items-center gap-1">
                      <Calculator className="h-3 w-3" />
                      {selectedAgent.commissionValue}% of Total
                    </span>
                  )}
                  {selectedAgent.commissionType === 'fixed' && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(selectedAgent.commissionValue)}
                    </span>
                  )}
                </span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Commission:</span>{' '}
                <span className="font-semibold text-primary">
                  {formatCurrency(calculateCommission(selectedAgent))}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

