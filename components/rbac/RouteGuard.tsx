"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RouteGuardProps {
  module: string;
  action: string;
  customAction?: string;
  redirectTo?: string;
  children: ReactNode;
}

/**
 * Route guard - redirects if user doesn't have permission
 */
export function RouteGuard({
  module,
  action,
  customAction,
  redirectTo = "/",
  children,
}: RouteGuardProps) {
  const router = useRouter();
  const { hasPermission, isLoading, isSuperAdmin } = usePermissions();

  useEffect(() => {
    // Super admins bypass all permission checks
    if (isSuperAdmin) return;
    
    if (!isLoading && !hasPermission(module, action, customAction)) {
      router.push(redirectTo);
    }
  }, [hasPermission, module, action, customAction, isLoading, router, redirectTo, isSuperAdmin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // Super admins bypass all permission checks
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  if (!hasPermission(module, action, customAction)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page. Redirecting...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

