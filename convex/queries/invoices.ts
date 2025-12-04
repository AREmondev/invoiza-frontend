import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all invoices (sales) for an organization
 */
export const getInvoices = query({
  args: {
    userEmail: v.optional(v.string()),
    type: v.optional(v.union(v.literal("sale"), v.literal("purchase"))),
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

    const organizationId = currentUser.organizationId;

    // Query invoices
    let invoicesQuery = ctx.db
      .query("invoices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId));

    const invoices = await invoicesQuery.collect();

    // Filter by type if provided
    let filteredInvoices = invoices;
    if (args.type) {
      filteredInvoices = invoices.filter((inv) => inv.type === args.type);
    }

    // Sort by date (newest first)
    filteredInvoices.sort((a, b) => b.invoiceDate - a.invoiceDate);

    // Get customer names for sales invoices
    const invoicesWithCustomers = await Promise.all(
      filteredInvoices.map(async (invoice) => {
        let customerName = null;
        if (invoice.customerId) {
          const customer = await ctx.db.get(invoice.customerId);
          customerName = customer?.name || null;
        }

        return {
          ...invoice,
          customerName,
        };
      })
    );

    return invoicesWithCustomers;
  },
});

/**
 * Get a single invoice by ID
 */
export const getInvoice = query({
  args: {
    invoiceId: v.id("invoices"),
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
      throw new Error("User not found");
    }

    const invoice = await ctx.db.get(args.invoiceId);

    if (!invoice) {
      return null;
    }

    // Verify user has access (same organization)
    if (invoice.organizationId !== currentUser.organizationId) {
      throw new Error("Access denied");
    }

    // Get customer name if exists
    let customerName = null;
    if (invoice.customerId) {
      const customer = await ctx.db.get(invoice.customerId);
      customerName = customer?.name || null;
    }

    return {
      ...invoice,
      customerName,
    };
  },
});

