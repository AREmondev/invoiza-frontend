/**
 * Auth helper functions for Convex queries/mutations
 * These help bridge NextAuth sessions with Convex
 */

/**
 * Get user email from NextAuth session (for use in Convex queries)
 */
export function getUserEmailFromSession(session: any): string | undefined {
  return session?.user?.email;
}

/**
 * Create query args with user email for Convex
 */
export function withUserEmail(args: Record<string, any> = {}, session: any) {
  const email = getUserEmailFromSession(session);
  return email ? { ...args, userEmail: email } : args;
}

