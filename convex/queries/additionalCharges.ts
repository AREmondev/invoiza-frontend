import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all additional charges for the current organization
 */
export const getAdditionalCharges = query({
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

    const charges = await ctx.db
      .query("additionalCharges")
      .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
      .collect();

    return charges;
  },
});

