import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Get the current session on the server
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user on the server
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

