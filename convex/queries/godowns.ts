import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all godowns for an organization
 */
export const getGodowns = query({
  args: {
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user
    let currentUser = null;
    if (args.userEmail) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.userEmail!))
        .first();
    }

    if (!currentUser) {
      return [];
    }

    const godowns = await ctx.db
      .query("godowns")
      .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return godowns;
  },
});

/**
 * Get a single godown by ID
 */
export const getGodown = query({
  args: {
    godownId: v.id("godowns"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const godown = await ctx.db.get(args.godownId);
    return godown;
  },
});

