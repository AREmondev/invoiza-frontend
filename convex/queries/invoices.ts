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

/**
 * Get unpaid or partially paid invoices for a customer
 */
export const getCustomerUnpaidInvoices = query({
  args: {
    customerId: v.id("customers"),
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

    const organizationId = currentUser.organizationId;

    // Get customer to verify access
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.organizationId !== organizationId) {
      return [];
    }

    // Get all invoices for this customer that are unpaid or partially paid
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "sale"),
          q.or(
            q.eq(q.field("paymentStatus"), "pending"),
            q.eq(q.field("paymentStatus"), "partial")
          )
        )
      )
      .collect();

    // Get payments for these invoices
    const invoiceIds = invoices.map((inv) => inv._id);
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

    // Calculate paid amounts from payments
    const invoicesWithPayments = invoices.map((invoice) => {
      const invoicePayments = allPayments.filter(
        (p) => p.invoiceId === invoice._id
      );
      const totalPaidFromPayments = invoicePayments.reduce(
        (sum, p) => sum + p.amountCents,
        0
      );

      // Use the higher of invoice.paidCents or totalPaidFromPayments
      // This handles cases where paidCents was set but payment record wasn't created yet
      const calculatedPaidCents = Math.max(invoice.paidCents || 0, totalPaidFromPayments);
      const calculatedDueCents = Math.max(0, invoice.totalCents - calculatedPaidCents);

      return {
        ...invoice,
        payments: invoicePayments,
        calculatedPaidCents,
        calculatedDueCents,
      };
    });

    // Filter out invoices with no due amount and sort by date (oldest first - FIFO)
    const filteredInvoices = invoicesWithPayments
      .filter((inv) => inv.calculatedDueCents > 0)
      .sort((a, b) => a.invoiceDate - b.invoiceDate);

    return filteredInvoices;
  },
});

