"use client";

import { UserManagement } from "@/components/rbac/UserManagement";

export default function UsersPage() {
  return (
    <div className="p-6 h-[calc(100vh-65px)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, roles, and permissions
        </p>
      </div>
      
      <UserManagement />
    </div>
  );
}

