import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all payments for the current organization
 */
export const getPayments = query({
  args: {
    userEmail: v.optional(v.string()),
    invoiceId: v.optional(v.id("invoices")),
    paymentMethod: v.optional(v.string()),
    limit: v.optional(v.number()),
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

    let payments = await ctx.db
      .query("payments")
      .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
      .collect();

    // Filter by invoice if provided
    if (args.invoiceId) {
      payments = payments.filter((p) => p.invoiceId === args.invoiceId);
    }

    // Filter by payment method if provided
    if (args.paymentMethod) {
      payments = payments.filter((p) => p.paymentMethod === args.paymentMethod);
    }

    // Sort by date (newest first)
    payments.sort((a, b) => b.paymentDate - a.paymentDate);

    // Apply limit
    if (args.limit) {
      payments = payments.slice(0, args.limit);
    }

    return payments;
  },
});

/**
 * Get total payments received by payment method
 */
export const getPaymentTotalsByMethod = query({
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
      return {};
    }

    // Get all payments for this organization
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
      .collect();

    // Calculate totals by payment method
    const totalsByMethod: Record<string, number> = {};
    
    payments.forEach((payment) => {
      const methodCode = payment.paymentMethod;
      if (!totalsByMethod[methodCode]) {
        totalsByMethod[methodCode] = 0;
      }
      totalsByMethod[methodCode] += payment.amountCents;
    });

    return totalsByMethod;
  },
});

