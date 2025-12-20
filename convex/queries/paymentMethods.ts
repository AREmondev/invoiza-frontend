import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all payment methods for the current organization
 */
export const getPaymentMethods = query({
  args: {
    userEmail: v.optional(v.string()),
    includeInactive: v.optional(v.boolean()),
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

    let methods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
      .collect();

    if (!args.includeInactive) {
      methods = methods.filter((m) => m.isActive);
    }

    // Sort by sortOrder
    methods.sort((a, b) => a.sortOrder - b.sortOrder);

    return methods;
  },
});

/**
 * Get a single payment method by ID
 */
export const getPaymentMethod = query({
  args: {
    methodId: v.id("paymentMethods"),
  },
  handler: async (ctx, args) => {
    const method = await ctx.db.get(args.methodId);
    return method;
  },
});

/**
 * Get payment methods by type
 */
export const getPaymentMethodsByType = query({
  args: {
    userEmail: v.optional(v.string()),
    type: v.union(
      v.literal("cash"),
      v.literal("bank"),
      v.literal("e_wallet"),
      v.literal("card"),
      v.literal("check"),
      v.literal("other")
    ),
    includeInactive: v.optional(v.boolean()),
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

    let methods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_organization_type", (q) =>
        q.eq("organizationId", currentUser.organizationId).eq("type", args.type)
      )
      .collect();

    if (!args.includeInactive) {
      methods = methods.filter((m) => m.isActive);
    }

    // Sort by sortOrder
    methods.sort((a, b) => a.sortOrder - b.sortOrder);

    return methods;
  },
});

