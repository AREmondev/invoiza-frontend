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

/**
 * Get customer sales history
 */
export const getCustomerSalesHistory = query({
  args: {
    customerId: v.id("customers"),
    userEmail: v.optional(v.string()),
    limit: v.optional(v.number()),
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

    // Get customer and verify access
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.organizationId !== currentUser.organizationId) {
      return [];
    }

    // Get all sales invoices for this customer
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .filter((q) => q.eq(q.field("type"), "sale"))
      .order("desc")
      .collect();

    const limit = args.limit || 50;
    const limitedInvoices = invoices.slice(0, limit);

    // Get payments for these invoices
    const invoiceIds = limitedInvoices.map((inv) => inv._id);
    const payments = await Promise.all(
      invoiceIds.map(async (invoiceId) => {
        return await ctx.db
          .query("payments")
          .withIndex("by_invoice", (q) => q.eq("invoiceId", invoiceId))
          .collect();
      })
    );

    // Flatten payments array
    const allPayments = payments.flat();

    // Attach payments to invoices
    const invoicesWithPayments = limitedInvoices.map((invoice) => {
      const invoicePayments = allPayments.filter(
        (p) => p.invoiceId === invoice._id
      );
      
      return {
        ...invoice,
        payments: invoicePayments,
      };
    });

    return invoicesWithPayments;
  },
});

