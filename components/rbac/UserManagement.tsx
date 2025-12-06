"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/lib/convex";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, User, Mail, Shield } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGuard } from "./PermissionGuard";
import { useToast } from "@/hooks/use-toast";

export function UserManagement() {
  const { hasPermission, user: currentUser, isSuperAdmin } = usePermissions();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  
  const users = useQuery(
    api.queries.users.getUsers,
    userEmail ? { userEmail } : "skip"
  );
  const roles = useQuery(
    api.queries.roles.getRoles,
    userEmail ? { userEmail } : "skip"
  );
  const createUser = useMutation(api.mutations.users.createUser);
  const updateUser = useMutation(api.mutations.users.updateUser);
  const deleteUser = useMutation(api.mutations.users.deleteUser);
  const hashPassword = useAction(api.actions.auth.hashPassword);

  // Super admins can do everything
  const canCreate = isSuperAdmin || hasPermission("users", "create");
  const canEdit = isSuperAdmin || hasPermission("users", "edit");
  const canDelete = isSuperAdmin || hasPermission("users", "delete");

  const handleCreateUser = async (data: {
    email: string;
    name: string;
    password?: string;
    roleIds: string[];
    isActive: boolean;
  }) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create users",
        variant: "destructive",
      });
      return;
    }

    try {
      // Hash password if provided
      let passwordHash: string | undefined;
      if (data.password && data.password.trim()) {
        const result = await hashPassword({ password: data.password });
        passwordHash = result.hash;
      }

      await createUser({
        email: data.email,
        name: data.name,
        organizationId: currentUser.organizationId,
        roleIds: data.roleIds as any,
        isActive: data.isActive,
        authProvider: "email",
        authProviderId: data.email, // In real app, use proper auth ID
        passwordHash: passwordHash,
        userEmail: userEmail || undefined, // Pass current user email for authentication
      });

      toast({
        title: "Success",
        description: "User created successfully",
      });
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (userId: string, data: {
    name?: string;
    password?: string;
    roleIds?: string[];
    isActive?: boolean;
  }) => {
    try {
      // Hash password if provided
      let passwordHash: string | undefined;
      if (data.password && data.password.trim()) {
        const result = await hashPassword({ password: data.password });
        passwordHash = result.hash;
      }

      await updateUser({
        userId: userId as any,
        name: data.name,
        passwordHash: passwordHash,
        roleIds: data.roleIds as any,
        isActive: data.isActive,
        userEmail: userEmail || undefined, // Pass current user email for authentication
      });

      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setSelectedUserId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser({ userId: userId as any });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage users and their role assignments
          </p>
        </div>
        {(canCreate || isSuperAdmin) && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to your organization.
                </DialogDescription>
              </DialogHeader>
              <UserForm
                onSubmit={handleCreateUser}
                roles={roles || []}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users === undefined ? (
            <div className="text-center py-8">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.map((role: any) => (
                          <Badge key={role._id} variant="secondary">
                            {role.displayName}
                          </Badge>
                        ))}
                        {user.isSuperAdmin && (
                          <Badge variant="default">
                            <Shield className="h-3 w-3 mr-1" />
                            Super Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isSuperAdmin ? (
                        <Badge variant="destructive">Super Admin</Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <PermissionGuard module="users" action="edit">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedUserId(user._id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard module="users" action="delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={user._id === currentUser?._id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {selectedUserId && (
        <Dialog open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and roles.
              </DialogDescription>
            </DialogHeader>
            <EditUserForm
              user={users?.find((u: any) => u._id === selectedUserId)}
              roles={roles || []}
              onSubmit={(data) => {
                handleUpdateUser(selectedUserId, data);
              }}
              onCancel={() => setSelectedUserId(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface UserFormProps {
  onSubmit: (data: {
    email: string;
    name: string;
    password?: string;
    roleIds: string[];
    isActive: boolean;
  }) => void;
  roles: Array<{ _id: string; name: string; displayName: string }>;
  onCancel: () => void;
}

function UserForm({ onSubmit, roles, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    roleIds: [] as string[],
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Leave empty to set later"
        />
        <p className="text-xs text-muted-foreground">
          Set a password for email authentication. Leave empty if user will use OAuth.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="roles">Roles</Label>
        <Select
          value={formData.roleIds[0] || ""}
          onValueChange={(value) =>
            setFormData({ ...formData, roleIds: value ? [value] : [] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role._id} value={role._id}>
                {role.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create User</Button>
      </DialogFooter>
    </form>
  );
}

interface EditUserFormProps {
  user: any;
  roles: Array<{ _id: string; name: string; displayName: string }>;
  onSubmit: (data: {
    name?: string;
    password?: string;
    roleIds?: string[];
    isActive?: boolean;
  }) => void;
  onCancel: () => void;
}

function EditUserForm({ user, roles, onSubmit, onCancel }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    password: "",
    roleIds: user?.roles?.map((r: any) => r._id) || [],
    isActive: user?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Leave empty to keep current password"
        />
        <p className="text-xs text-muted-foreground">
          Enter a new password to change it. Leave empty to keep the current password.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="roles">Roles</Label>
        <Select
          value={formData.roleIds[0] || ""}
          onValueChange={(value) =>
            setFormData({ ...formData, roleIds: value ? [value] : [] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role._id} value={role._id}>
                {role.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isActive">Active</Label>
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  );
}
