"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/lib/convex";
import { Plus, Edit, Trash2, Save, Shield, Key, User, Mail, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogDescription } from "@radix-ui/react-dialog";
import { MODULES, ACTIONS, PERMISSION_SCOPES } from "@/convex/lib/permissions";

interface RolePermissionManagerProps {
  compact?: boolean;
}

export function RolePermissionManager({ compact = false }: RolePermissionManagerProps) {
  const { hasPermission, user: currentUser, isSuperAdmin } = usePermissions();
  const { toast } = useToast();
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'role' | 'permission' | 'user', id: string } | null>(null);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("roles");

  
  // Convex queries
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  
  const roles = useQuery(
    api.queries.roles.getRoles,
    userEmail ? { userEmail } : "skip"
  );
  const permissions = useQuery(
    api.queries.permissions.getAllPermissions,
    userEmail ? { userEmail } : "skip"
  );
  const users = useQuery(
    api.queries.users.getUsers,
    userEmail ? { userEmail } : "skip"
  );
  
  // Convex mutations
  const createRole = useMutation(api.mutations.roles.createRole);
  const updateRole = useMutation(api.mutations.roles.updateRole);
  const deleteRole = useMutation(api.mutations.roles.deleteRole);
  const assignPermission = useMutation(api.mutations.permissions.assignPermissionToRole);
  const revokePermission = useMutation(api.mutations.permissions.revokePermissionFromRole);
  const createCustomPermission = useMutation(api.mutations.permissions.createCustomPermission);
  const createUser = useMutation(api.mutations.users.createUser);
  const updateUser = useMutation(api.mutations.users.updateUser);
  const deleteUser = useMutation(api.mutations.users.deleteUser);
  const hashPassword = useAction(api.actions.auth.hashPassword);

  const handleSaveRole = async (roleData: {
    name: string;
    displayName: string;
    description?: string;
    priority: number;
    isDefault?: boolean;
    permissionIds: string[];
  }) => {
    // Super admins bypass permission checks
    if (!isSuperAdmin && !hasPermission("roles", editingRole ? "edit" : "create")) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to manage roles",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingRole) {
        await updateRole({
          roleId: editingRole._id as any,
          displayName: roleData.displayName,
          description: roleData.description,
          priority: roleData.priority,
          isDefault: roleData.isDefault,
          permissionIds: roleData.permissionIds as any,
          userEmail: userEmail || undefined, // Pass current user email for authentication
        });
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
      } else {
        await createRole({
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          priority: roleData.priority,
          isDefault: roleData.isDefault,
          permissionIds: roleData.permissionIds as any,
          userEmail: userEmail || undefined, // Pass current user email for authentication
        });
        toast({
          title: "Success",
          description: "Role created successfully",
        });
      }
      
      setShowRoleDialog(false);
      setEditingRole(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    // Super admins bypass permission checks
    if (!isSuperAdmin && !hasPermission("roles", "delete")) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete roles",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteRole({ 
        roleId: roleId as any,
        userEmail: userEmail || undefined, // Pass current user email for authentication
      });
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
      setDeleteConfirm(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  const toggleRolePermission = async (roleId: string, permissionId: string, currentlyHasPermission: boolean) => {
    // Super admins bypass permission checks
    if (!isSuperAdmin && !hasPermission("roles", "edit")) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to manage roles",
        variant: "destructive",
      });
      return;
    }

    try {
      if (currentlyHasPermission) {
        await revokePermission({
          roleId: roleId as any,
          permissionId: permissionId as any,
          userEmail: userEmail || undefined, // Pass current user email for authentication
        });
      } else {
        await assignPermission({
          roleId: roleId as any,
          permissionId: permissionId as any,
          userEmail: userEmail || undefined, // Pass current user email for authentication
        });
      }
      toast({
        title: "Success",
        description: "Permission updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update permission",
        variant: "destructive",
      });
    }
  };

  // Group permissions by category
  const groupedPermissions = permissions?.reduce((acc: any, permission: any) => {
    const category = permission.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, any[]>) || {};

  // Create permission ID for matching
  const getPermissionId = (permission: any) => {
    if (permission.action === "custom" && permission.customAction) {
      return `${permission.module}:${permission.action}:${permission.customAction}`;
    }
    return `${permission.module}:${permission.action}`;
  };

  // Check if role has permission
  const roleHasPermission = (role: any, permission: any) => {
    if (!role.permissions) return false;
    const permId = permission._id;
    return role.permissions.some((p: any) => p._id === permId);
  };

  // User management handlers
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
        authProviderId: data.email,
        passwordHash: passwordHash,
        userEmail: userEmail || undefined,
      });

      toast({
        title: "Success",
        description: "User created successfully",
      });
      setIsCreateUserDialogOpen(false);
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
        userEmail: userEmail || undefined,
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
      setDeleteConfirm(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  // Super admins can do everything
  const canCreateUser = isSuperAdmin || hasPermission("users", "create");
  const canEditUser = isSuperAdmin || hasPermission("users", "edit");
  const canDeleteUser = isSuperAdmin || hasPermission("users", "delete");

  // Super admins can always view
  if (!isSuperAdmin && !hasPermission("roles", "view") && !hasPermission("permissions", "view")) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You don't have permission to view roles and permissions.</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Roles & Permissions</h3>
          <PermissionGuard module="roles" action="create">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRoleDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Role
            </Button>
          </PermissionGuard>
        </div>
        
        <div className="space-y-2">
          {roles?.filter((role: any) => role.isActive).map((role: any) => (
            <div key={role._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <div>
                <p className="font-medium">{role.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {role.permissions?.length || 0} permissions
                </p>
              </div>
              <Badge variant="outline">{role.name}</Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Roles & Permissions</h2>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions for the system
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Key className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Users</CardTitle>
                {canCreateUser && (
                  <Button
                    onClick={() => setIsCreateUserDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {users === undefined ? (
                <div className="text-center py-8">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found. Create your first user to get started.
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
                            {canEditUser && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedUserId(user._id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteUser && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirm({ type: "user", id: user._id })}
                                disabled={user._id === currentUser?._id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-end">
            {(isSuperAdmin || hasPermission("roles", "create")) && (
              <Button
                onClick={() => {
                  setEditingRole(null);
                  setShowRoleDialog(true);
                }}
              >
                <Shield className="h-4 w-4 mr-2" />
                New Role
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
            </CardHeader>
            <CardContent>
              {roles === undefined ? (
                <div className="text-center py-8">Loading...</div>
              ) : roles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No roles found. Create your first role to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role: any) => (
                      <TableRow key={role._id}>
                        <TableCell className="font-mono">{role.name}</TableCell>
                        <TableCell>{role.displayName}</TableCell>
                        <TableCell>{role.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {role.permissions?.length || 0} permissions
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.isActive ? "default" : "secondary"}>
                            {role.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.type === "system" ? "default" : "outline"}>
                            {role.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(isSuperAdmin || hasPermission("roles", "edit")) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingRole(role);
                                  setShowRoleDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {role.type !== "system" && (isSuperAdmin || hasPermission("roles", "delete")) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirm({ type: "role", id: role._id })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <div className="flex justify-end">
            {(isSuperAdmin || hasPermission("permissions", "create")) && (
              <Button
                onClick={() => setShowPermissionDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Permission
              </Button>
            )}
          </div>
          {permissions && permissions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Permission Matrix</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Toggle permissions for each role. Permissions are grouped by category.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[300px]">Permission</TableHead>
                        {roles?.filter((r: any) => r.isActive).map((role: any) => (
                          <TableHead key={role._id} className="text-center min-w-[120px]">
                            <div className="flex flex-col items-center gap-1">
                              <p className="font-medium text-sm">{role.displayName}</p>
                              <Badge variant="outline" className="text-xs">
                                {role.permissions?.length || 0}
                              </Badge>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                        const perms = categoryPermissions as any[];
                        return (
                        <>
                          <TableRow key={category} className="bg-muted/50">
                            <TableCell colSpan={(roles?.filter((r: any) => r.isActive).length || 0) + 1} className="font-semibold py-3">
                              <div className="flex items-center gap-2">
                                <Key className="h-4 w-4" />
                                {category}
                              </div>
                            </TableCell>
                          </TableRow>
                          {perms.map((permission: any) => (
                            <TableRow key={permission._id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{permission.displayName}</p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {permission.module}:{permission.action}
                                    {permission.customAction && `:${permission.customAction}`}
                                  </p>
                                </div>
                              </TableCell>
                              {roles?.filter((r: any) => r.isActive).map((role: any) => (
                                <TableCell key={role._id} className="text-center">
                                  {(isSuperAdmin || hasPermission("roles", "edit")) ? (
                                    <Switch
                                      checked={roleHasPermission(role, permission)}
                                      onCheckedChange={(checked) =>
                                        toggleRolePermission(role._id, permission._id, !checked)
                                      }
                                    />
                                  ) : (
                                    <div className="flex justify-center">
                                      {roleHasPermission(role, permission) ? (
                                        <Badge variant="default" className="text-xs">✓</Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs">-</Badge>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
          </DialogHeader>
          <RoleForm
            role={editingRole}
            permissions={Array.isArray(permissions) ? permissions : []}
            onSave={handleSaveRole}
            onCancel={() => {
              setEditingRole(null);
              setShowRoleDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
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
            onCancel={() => setIsCreateUserDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

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

      {/* Create Permission Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
            <DialogDescription>
              Create a custom permission for your application modules.
            </DialogDescription>
          </DialogHeader>
          <PermissionForm
            onSave={async (data) => {
              try {
                await createCustomPermission({
                  module: data.module,
                  action: data.action as "view" | "create" | "edit" | "delete" | "export" | "approve" | "custom",
                  customAction: data.customAction,
                  displayName: data.displayName,
                  description: data.description,
                  category: data.category,
                  scope: data.scope as "global" | "own" | "team" | "department",
                  userEmail: userEmail || undefined,
                });
                toast({
                  title: "Success",
                  description: "Permission created successfully",
                });
                setShowPermissionDialog(false);
              } catch (error: any) {
                toast({
                  title: "Error",
                  description: error.message || "Failed to create permission",
                  variant: "destructive",
                });
              }
            }}
            onCancel={() => setShowPermissionDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteConfirm?.type === "role" ? "Role" : deleteConfirm?.type === "user" ? "User" : "Permission"}?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  if (deleteConfirm.type === "role") {
                    handleDeleteRole(deleteConfirm.id);
                  } else if (deleteConfirm.type === "user") {
                    handleDeleteUser(deleteConfirm.id);
                  }
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface PermissionFormProps {
  onSave: (data: {
    module: string;
    action: string;
    customAction?: string;
    displayName: string;
    description?: string;
    category?: string;
    scope: string;
  }) => void;
  onCancel: () => void;
}

function PermissionForm({ onSave, onCancel }: PermissionFormProps) {
  const [formData, setFormData] = useState({
    module: "",
    action: "",
    customAction: "",
    displayName: "",
    description: "",
    category: "",
    scope: "global",
  });

  const moduleOptions = Object.values(MODULES).map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " "),
  }));

  const actionOptions = Object.values(ACTIONS).map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  }));

  const scopeOptions = Object.values(PERMISSION_SCOPES).map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.module || !formData.action || !formData.displayName) {
      return;
    }
    if (formData.action === "custom" && !formData.customAction) {
      return;
    }
    onSave({
      module: formData.module,
      action: formData.action,
      customAction: formData.action === "custom" ? formData.customAction : undefined,
      displayName: formData.displayName,
      description: formData.description || undefined,
      category: formData.category || undefined,
      scope: formData.scope,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="module">Module *</Label>
        <Select
          value={formData.module}
          onValueChange={(value) => setFormData({ ...formData, module: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a module" />
          </SelectTrigger>
          <SelectContent>
            {moduleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="action">Action *</Label>
        <Select
          value={formData.action}
          onValueChange={(value) => setFormData({ ...formData, action: value, customAction: "" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an action" />
          </SelectTrigger>
          <SelectContent>
            {actionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.action === "custom" && (
        <div className="space-y-2">
          <Label htmlFor="customAction">Custom Action *</Label>
          <Input
            id="customAction"
            value={formData.customAction}
            onChange={(e) => setFormData({ ...formData, customAction: e.target.value })}
            placeholder="e.g., refund, cancel, archive"
          />
          <p className="text-xs text-muted-foreground">
            Enter a custom action name (lowercase, no spaces)
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name *</Label>
        <Input
          id="displayName"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder="e.g., View Sales, Create Products"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this permission allows"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="e.g., Sales, Products, Customers"
        />
        <p className="text-xs text-muted-foreground">
          Optional: Group permissions by category
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scope">Scope *</Label>
        <Select
          value={formData.scope}
          onValueChange={(value) => setFormData({ ...formData, scope: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {scopeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Global: Organization-wide access | Own: Own records only | Team: Team records | Department: Department records
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.module || !formData.action || !formData.displayName || (formData.action === "custom" && !formData.customAction)}>
          Create Permission
        </Button>
      </DialogFooter>
    </form>
  );
}

interface RoleFormProps {
  role?: any;
  permissions: any[];
  onSave: (role: {
    name: string;
    displayName: string;
    description?: string;
    priority: number;
    isDefault?: boolean;
    permissionIds: string[];
  }) => void;
  onCancel: () => void;
}

function RoleForm({ role, permissions, onSave, onCancel }: RoleFormProps) {
  const [formData, setFormData] = useState({
    name: role?.name || "",
    displayName: role?.displayName || "",
    description: role?.description || "",
    priority: role?.priority || 50,
    isDefault: role?.isDefault ?? false,
    permissionIds: role?.permissions?.map((p: any) => p._id) || [],
  });

  // Debug: Log permissions to see if they're being passed
  console.log("RoleForm - permissions:", permissions);
  console.log("RoleForm - formData.permissionIds:", formData.permissionIds);

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id: string) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Group permissions by category
  const groupedPermissions: Record<string, any[]> = 
    permissions && Array.isArray(permissions) && permissions.length > 0
      ? permissions.reduce((acc: Record<string, any[]>, permission: any) => {
          if (!permission || !permission._id) return acc; // Skip invalid permissions
          const category = permission.category || "General";
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(permission);
          return acc;
        }, {} as Record<string, any[]>)
      : {};

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., sales_manager"
              required
              disabled={!!role} // Cannot change name of existing role
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, displayName: e.target.value }))
              }
              placeholder="e.g., Sales Manager"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Describe the role's responsibilities"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  priority: parseInt(e.target.value) || 50,
                }))
              }
              min="0"
              max="100"
            />
            <p className="text-xs text-muted-foreground">
              Higher number = more permissions (for inheritance)
            </p>
          </div>
          <div className="flex items-center justify-between pt-6">
            <Label htmlFor="isDefault">Default Role</Label>
            <Switch
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isDefault: checked }))
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Permissions</Label>
            <span className="text-sm text-muted-foreground">
              {formData.permissionIds.length} selected
            </span>
          </div>
          {!permissions || permissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <p className="text-sm">
                {permissions === undefined 
                  ? "Loading permissions..." 
                  : "No permissions available. Please seed permissions first."}
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto border rounded-lg p-4">
              {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                const perms = categoryPermissions as any[];
                return (
                  <div key={category} className="space-y-2 mb-4 last:mb-0">
                    <h4 className="font-semibold text-sm sticky top-0 bg-background py-2 border-b">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {perms.map((permission: any) => (
                        <label
                          key={permission._id}
                          className="flex items-start space-x-3 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
                        >
                          <Checkbox
                            checked={formData.permissionIds.includes(permission._id)}
                            onCheckedChange={() => togglePermission(permission._id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block">
                              {permission.displayName}
                            </span>
                            <p className="text-xs text-muted-foreground font-mono">
                              {permission.module}:{permission.action}
                              {permission.customAction && `:${permission.customAction}`}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Save Role
        </Button>
      </DialogFooter>
    </form>
  );
}

// User Form Components
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

      <div className="flex items-center justify-between">
        <Label htmlFor="isActive">Active</Label>
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
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
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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
