import { ConvexReactClient } from "convex/react";

// Initialize Convex client
// Replace with your Convex deployment URL
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

if (!CONVEX_URL) {
  console.warn(
    "NEXT_PUBLIC_CONVEX_URL is not set. Please set it in your .env.local file."
  );
}

export const convex = new ConvexReactClient(CONVEX_URL);

// Export API for use in components
export { api } from "../convex/_generated/api";
