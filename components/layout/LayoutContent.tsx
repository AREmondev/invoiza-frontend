"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  console.log('session', session);
  const isAuthPage = pathname?.startsWith("/auth") || pathname === "/setup";
  const isAuthenticated = status === "authenticated";

  // Show full layout only for authenticated users on non-auth pages
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <div className="relative flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:pl-72">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}

