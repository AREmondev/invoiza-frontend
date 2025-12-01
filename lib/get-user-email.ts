"use client";

import { useSession } from "next-auth/react";

/**
 * Hook to get user email from NextAuth session
 * Use this in components that need to pass email to Convex queries
 */
export function useUserEmail() {
  const { data: session } = useSession();
  return session?.user?.email;
}

