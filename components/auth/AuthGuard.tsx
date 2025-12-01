"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
}

/**
 * Component to guard routes that require authentication
 */
export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  console.log('auth guard session', session);
  useEffect(() => {
    if (requireAuth && status === "unauthenticated") {
      // Use replace to avoid adding to history stack
      router.replace("/auth/login");
    }
  }, [status, requireAuth, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && status === "unauthenticated") {
    return null; // Will redirect
  }

  return <>{children}</>;
}

