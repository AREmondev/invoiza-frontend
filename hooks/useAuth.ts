"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";

/**
 * Hook to get current authenticated user with permissions
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const user = useQuery(
    api.queries.auth.getAuthUser,
    status === "authenticated" ? {} : "skip"
  );
  console.log("auth session from useAuth", session);
  return {
    session,
    user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated" && !!user,
  };
}

