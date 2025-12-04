import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all customers for an organization
 */
export const getCustomers = query({
  args: {
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user
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

    const customers = await ctx.db
      .query("customers")
      .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return customers;
  },
});

/**
 * Get a single customer by ID
 */
export const getCustomer = query({
  args: {
    customerId: v.id("customers"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    if (!customer) return null;

    // Get current user for authorization check
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

    if (!currentUser || customer.organizationId !== currentUser.organizationId) {
      return null;
    }

    return customer;
  },
});

