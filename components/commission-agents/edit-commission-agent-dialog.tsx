"use client";

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/convex';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditCommissionAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: any;
  onSuccess?: () => void;
}

export function EditCommissionAgentDialog({
  open,
  onOpenChange,
  agent,
  onSuccess,
}: EditCommissionAgentDialogProps) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();

  const updateAgent = useMutation(api.mutations.commissionAgents.updateCommissionAgent);

  useEffect(() => {
    if (agent) {
      setName(agent.name || '');
      setMobile(agent.mobile || '');
      setEmail(agent.email || '');
      setAddress(agent.address || '');
      setNotes(agent.notes || '');
      setIsActive(agent.isActive !== false);
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !mobile.trim()) {
      toast({
        title: "Error",
        description: "Name and mobile are required",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateAgent({
        agentId: agent._id,
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        isActive,
        userEmail,
      });

      toast({
        title: "Success",
        description: "Commission agent updated successfully",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update commission agent",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Commission Agent</DialogTitle>
          <DialogDescription>
            Update commission agent information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Agent name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mobile">Mobile *</Label>
              <Input
                id="edit-mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Mobile number"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Active</Label>
              <Switch
                id="edit-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || !name.trim() || !mobile.trim()}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Agent"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

