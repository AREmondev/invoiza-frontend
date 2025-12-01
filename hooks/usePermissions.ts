"use client";

import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { useMemo } from "react";
import { useSession } from "next-auth/react";

/**
 * Hook to get current user permissions
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const userEmail = session?.user?.email;
  
  const permissions = useQuery(
    api.queries.permissions.getCurrentUserPermissions,
    isAuthenticated && userEmail ? { userEmail } : "skip"
  );
  const user = useQuery(
    api.queries.permissions.getCurrentUser,
    isAuthenticated && userEmail ? { userEmail } : "skip"
  );

  const hasPermission = useMemo(
    () => (module: string, action: string, customAction?: string) => {
      // Super admin check first - if user is super admin, always return true
      if (user?.isSuperAdmin) return true;
      if (!permissions) return false;

      const permissionId = customAction
        ? `${module}:${action}:${customAction}`
        : `${module}:${action}`;

      return permissions.includes(permissionId);
    },
    [permissions, user]
  );

  const hasAnyPermission = useMemo(
    () => (
      permissionChecks: Array<{ module: string; action: string; customAction?: string }>
    ) => {
      // Super admin check first
      if (user?.isSuperAdmin) return true;
      if (!permissions) return false;

      return permissionChecks.some(({ module, action, customAction }) => {
        const permissionId = customAction
          ? `${module}:${action}:${customAction}`
          : `${module}:${action}`;
        return permissions.includes(permissionId);
      });
    },
    [permissions, user]
  );

  const hasAllPermissions = useMemo(
    () => (
      permissionChecks: Array<{ module: string; action: string; customAction?: string }>
    ) => {
      // Super admin check first
      if (user?.isSuperAdmin) return true;
      if (!permissions) return false;

      return permissionChecks.every(({ module, action, customAction }) => {
        const permissionId = customAction
          ? `${module}:${action}:${customAction}`
          : `${module}:${action}`;
        return permissions.includes(permissionId);
      });
    },
    [permissions, user]
  );

  return {
    permissions: permissions || [],
    user,
    isLoading: permissions === undefined,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin: user?.isSuperAdmin ?? false,
  };
}

/**
 * Hook to check a specific permission
 */
export function usePermission(module: string, action: string, customAction?: string) {
  const { hasPermission, isLoading } = usePermissions();

  return {
    hasPermission: hasPermission(module, action, customAction),
    isLoading,
  };
}
