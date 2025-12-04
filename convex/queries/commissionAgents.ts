import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all commission agents for the current organization
 */
export const getCommissionAgents = query({
  args: {
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser = null;
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        currentUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
      }
    } catch {}

    if (!currentUser && args.userEmail) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.userEmail!))
        .first();
    }

    if (!currentUser) {
      return [];
    }

    const agents = await ctx.db
      .query("commissionAgents")
      .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
      .collect();

    return agents;
  },
});

