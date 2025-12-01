"use client";

import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { ReactNode } from "react";

interface ConditionalLayoutProps {
  children: ReactNode;
}

/**
 * Conditionally renders layout based on route
 * - Auth routes (/auth/*, /setup): No sidebar/header, no auth guard
 * - Other routes: Full layout with sidebar/header and auth guard
 */
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/auth") || pathname === "/setup";

  // For auth routes, just render children without layout
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // For protected routes, show full layout with auth guard
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col lg:pl-72">
          <Header />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

