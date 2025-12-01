"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex';
import { Warehouse, Plus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface GodownSelectorProps {
  selectedGodownIds: string[];
  onGodownsChange: (godownIds: string[]) => void;
  allowMultiple?: boolean;
  allowCreate?: boolean;
  className?: string;
}

export function GodownSelector({
  selectedGodownIds,
  onGodownsChange,
  allowMultiple = true,
  allowCreate = false,
  className,
}: GodownSelectorProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    code: '',
    location: '',
    description: '',
  });

  const godowns = useQuery(
    api.queries.godowns.getGodowns,
    userEmail ? { userEmail } : "skip"
  );
  const createGodown = useMutation(api.mutations.godowns.createGodown);

  const selectedGodowns = godowns?.filter((g: any) => selectedGodownIds.includes(g._id)) || [];

  const handleGodownToggle = (godownId: string) => {
    if (allowMultiple) {
      if (selectedGodownIds.includes(godownId)) {
        onGodownsChange(selectedGodownIds.filter(id => id !== godownId));
      } else {
        onGodownsChange([...selectedGodownIds, godownId]);
      }
    } else {
      onGodownsChange([godownId]);
    }
  };

  const handleCreateGodown = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const godownId = await createGodown({
        name: createFormData.name,
        code: createFormData.code || undefined,
        location: createFormData.location || undefined,
        description: createFormData.description || undefined,
        userEmail: userEmail || undefined,
      });
      
      // Add the newly created godown to selection
      onGodownsChange([...selectedGodownIds, godownId as any]);
      
      // Reset form and close dialog
      setCreateFormData({ name: '', code: '', location: '', description: '' });
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Godown created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create godown",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label>Godown/Room {allowMultiple ? '(Multiple)' : ''}</Label>
        {allowCreate && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Godown
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateGodown}>
                <DialogHeader>
                  <DialogTitle>Create Godown/Room</DialogTitle>
                  <DialogDescription>
                    Add a new storage location to the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="godown-name">Name *</Label>
                    <Input
                      id="godown-name"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                      placeholder="e.g., Main Warehouse, Room 101"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="godown-code">Code</Label>
                    <Input
                      id="godown-code"
                      value={createFormData.code}
                      onChange={(e) => setCreateFormData({ ...createFormData, code: e.target.value })}
                      placeholder="e.g., WH-001, RM-101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="godown-location">Location</Label>
                    <Input
                      id="godown-location"
                      value={createFormData.location}
                      onChange={(e) => setCreateFormData({ ...createFormData, location: e.target.value })}
                      placeholder="e.g., Building A, Floor 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="godown-description">Description</Label>
                    <Textarea
                      id="godown-description"
                      value={createFormData.description}
                      onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                      placeholder="Additional details about this location"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setCreateFormData({ name: '', code: '', location: '', description: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Godown</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {godowns === undefined ? (
        <div className="text-sm text-muted-foreground">Loading godowns...</div>
      ) : godowns.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No godowns found. {allowCreate && "Click 'New Godown' to create one."}
        </div>
      ) : allowMultiple ? (
        <div className="space-y-2">
          {godowns.map((godown: any) => (
            <Card
              key={godown._id}
              className={cn(
                "p-3 cursor-pointer transition-colors",
                selectedGodownIds.includes(godown._id)
                  ? "bg-primary/10 border-primary"
                  : "hover:bg-accent/50"
              )}
              onClick={() => handleGodownToggle(godown._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{godown.name}</div>
                    {godown.code && (
                      <div className="text-xs text-muted-foreground">
                        Code: {godown.code}
                      </div>
                    )}
                    {godown.location && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {godown.location}
                      </div>
                    )}
                  </div>
                </div>
                {selectedGodownIds.includes(godown._id) && (
                  <Badge variant="default">Selected</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Select
          value={selectedGodownIds[0] || ''}
          onValueChange={(value) => onGodownsChange(value ? [value] : [])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select godown/room" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {godowns.map((godown: any) => (
              <SelectItem key={godown._id} value={godown._id}>
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  <span>{godown.name}</span>
                  {godown.code && (
                    <Badge variant="outline" className="text-xs">
                      {godown.code}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedGodowns.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedGodowns.map((godown: any) => (
            <Badge key={godown._id} variant="secondary" className="gap-1">
              <Warehouse className="h-3 w-3" />
              {godown.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

