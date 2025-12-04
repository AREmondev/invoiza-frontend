"use client";

import { useState } from 'react';
import { User, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CommissionAgentSelectorProps {
  selectedAgentId?: string;
  onAgentSelect: (agentId: string | undefined) => void;
  totalProfitCents?: number;
  totalAmountCents?: number;
  allowCreate?: boolean;
  className?: string;
}

export function CommissionAgentSelector({
  selectedAgentId,
  onAgentSelect,
  totalProfitCents = 0,
  totalAmountCents = 0,
  allowCreate = false,
  className,
}: CommissionAgentSelectorProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentMobile, setNewAgentMobile] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentAddress, setNewAgentAddress] = useState('');
  const [newAgentNotes, setNewAgentNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch commission agents from backend
  const agents = useQuery(
    api.queries.commissionAgents.getCommissionAgents,
    userEmail ? { userEmail } : "skip"
  );

  const createAgent = useMutation(api.mutations.commissionAgents.createCommissionAgent);

  const selectedAgent = agents?.find(a => a._id === selectedAgentId);

  const handleCreateAgent = async () => {
    if (!newAgentName.trim() || !newAgentMobile.trim()) {
      toast({
        title: "Error",
        description: "Name and mobile are required",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createAgent({
        name: newAgentName.trim(),
        mobile: newAgentMobile.trim(),
        email: newAgentEmail.trim() || undefined,
        address: newAgentAddress.trim() || undefined,
        notes: newAgentNotes.trim() || undefined,
        userEmail: userEmail || undefined,
      });

      toast({
        title: "Success",
        description: "Commission agent created successfully",
      });

      // Reset form
      setNewAgentName('');
      setNewAgentMobile('');
      setNewAgentEmail('');
      setNewAgentAddress('');
      setNewAgentNotes('');
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create commission agent",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
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
                  Add a new commission agent. Name and mobile are required.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="Agent name"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile *</Label>
                  <Input
                    type="tel"
                    placeholder="Mobile number"
                    value={newAgentMobile}
                    onChange={(e) => setNewAgentMobile(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="agent@example.com"
                    value={newAgentEmail}
                    onChange={(e) => setNewAgentEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    placeholder="Agent address"
                    value={newAgentAddress}
                    onChange={(e) => setNewAgentAddress(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes"
                    value={newAgentNotes}
                    onChange={(e) => setNewAgentNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAgent} disabled={isCreating || !newAgentName.trim() || !newAgentMobile.trim()}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Agent"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Select
        value={selectedAgentId || '__none__'}
        onValueChange={(value) => onAgentSelect(value === '__none__' ? undefined : value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select commission agent (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">None</SelectItem>
          {agents?.filter(a => a.isActive).map((agent) => (
            <SelectItem key={agent._id} value={agent._id}>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{agent.name}</span>
                {agent.mobile && (
                  <Badge variant="outline" className="text-xs">
                    {agent.mobile}
                  </Badge>
                )}
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
              {selectedAgent.mobile && (
                <Badge variant="outline" className="text-xs">
                  {selectedAgent.mobile}
                </Badge>
              )}
            </div>
            {selectedAgent.email && (
              <div className="text-sm text-muted-foreground">
                Email: {selectedAgent.email}
              </div>
            )}
            {selectedAgent.address && (
              <div className="text-sm text-muted-foreground">
                Address: {selectedAgent.address}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
