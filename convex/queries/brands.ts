import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all brands for an organization
 */
export const getBrands = query({
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

    const brands = await ctx.db
      .query("brands")
      .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return brands;
  },
});

/**
 * Get a single brand by ID
 */
export const getBrand = query({
  args: {
    brandId: v.id("brands"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const brand = await ctx.db.get(args.brandId);
    return brand;
  },
});

