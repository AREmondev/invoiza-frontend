"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PermissionGuardProps {
  module: string;
  action: string;
  customAction?: string;
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * Component guard - only renders children if user has permission
 */
export function PermissionGuard({
  module,
  action,
  customAction,
  children,
  fallback,
  showError = false,
}: PermissionGuardProps) {
  const { hasPermission, isLoading, isSuperAdmin } = usePermissions();

  if (isLoading) {
    return fallback || <div>Loading...</div>;
  }

  // Super admins bypass all permission checks
  const hasAccess = isSuperAdmin || hasPermission(module, action, customAction);

  if (!hasAccess) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this resource.
          </AlertDescription>
        </Alert>
      );
    }
    return fallback || null;
  }

  return <>{children}</>;
}

interface MultiplePermissionGuardProps {
  permissions: Array<{ module: string; action: string; customAction?: string }>;
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * Component guard for multiple permissions
 */
export function MultiplePermissionGuard({
  permissions,
  requireAll = false,
  children,
  fallback,
  showError = false,
}: MultiplePermissionGuardProps) {
  const { hasAnyPermission, hasAllPermissions, isLoading, isSuperAdmin } = usePermissions();

  if (isLoading) {
    return fallback || <div>Loading...</div>;
  }

  // Super admins bypass all permission checks
  const hasAccess = isSuperAdmin || (requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions));

  if (!hasAccess) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this resource.
          </AlertDescription>
        </Alert>
      );
    }
    return fallback || null;
  }

  return <>{children}</>;
}
