"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash, User, Phone, Mail, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/convex';
import { useToast } from '@/hooks/use-toast';
import { AddCommissionAgentDialog } from './add-commission-agent-dialog';
import { EditCommissionAgentDialog } from './edit-commission-agent-dialog';

export function CommissionAgentList() {
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();

  const deleteAgentMutation = useMutation(api.mutations.commissionAgents.deleteCommissionAgent);

  const agents = useQuery(
    api.queries.commissionAgents.getCommissionAgents,
    userEmail ? { userEmail } : "skip"
  ) || [];

  const handleEditAgent = (agent: any) => {
    setSelectedAgent(agent);
    setEditDialogOpen(true);
  };

  const handleDeleteAgent = (agent: any) => {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAgent = async () => {
    if (!agentToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAgentMutation({
        agentId: agentToDelete._id,
        userEmail,
      });

      toast({
        title: "Success",
        description: "Commission agent deleted successfully",
      });
      setDeleteDialogOpen(false);
      setAgentToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete commission agent",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">All Commission Agents</h2>
          <p className="text-muted-foreground">
            {agents.length} agent{agents.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Commission Agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No commission agents</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first commission agent
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Commission Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent: any) => (
            <Card key={agent._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <CardTitle>{agent.name}</CardTitle>
                  </div>
                  <Badge variant={agent.isActive ? "default" : "secondary"}>
                    {agent.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agent.mobile && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{agent.mobile}</span>
                    </div>
                  )}
                  {agent.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{agent.email}</span>
                    </div>
                  )}
                  {agent.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="line-clamp-2">{agent.address}</span>
                    </div>
                  )}
                  {agent.notes && (
                    <div className="text-sm text-muted-foreground mt-2">
                      <p className="line-clamp-2">{agent.notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditAgent(agent)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteAgent(agent)}
                    className="flex-1"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddCommissionAgentDialog open={open} onOpenChange={setOpen} />
      
      {selectedAgent && (
        <EditCommissionAgentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          agent={selectedAgent}
          onSuccess={() => {
            setEditDialogOpen(false);
            setSelectedAgent(null);
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commission Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{agentToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAgent}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

