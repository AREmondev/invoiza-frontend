import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get price and quantity history for a product and customer
 */
export const getPriceHistory = query({
  args: {
    productId: v.id("products"),
    customerId: v.id("customers"),
    variationId: v.optional(v.string()),
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

    const organizationId = currentUser.organizationId;
    const limit = args.limit || 5;

    // Query all invoices for this organization that are sales (not purchases)
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .filter((q) => q.eq(q.field("type"), "sale"))
      .filter((q) => q.eq(q.field("customerId"), args.customerId))
      .order("desc")
      .collect();

    // Extract price history from line items
    const history: Array<{
      invoiceId: string;
      invoiceNumber: string;
      invoiceDate: number;
      customerId: string;
      customerName: string;
      productId: string;
      variationId?: string;
      unitPriceCents: number;
      quantity: number;
      unit: string;
    }> = [];

    // Get customer name
    const customer = await ctx.db.get(args.customerId);
    const customerName = customer?.name || "Unknown Customer";

    for (const invoice of invoices) {
      // Filter line items for this product
      const relevantLineItems = invoice.lineItems.filter(
        (item) =>
          item.productId === args.productId &&
          (!args.variationId || item.variationId === args.variationId)
      );

      for (const item of relevantLineItems) {
        history.push({
          invoiceId: String(invoice._id),
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          customerId: String(args.customerId),
          customerName,
          productId: String(item.productId),
          variationId: item.variationId ? String(item.variationId) : undefined,
          unitPriceCents: item.unitPriceCents,
          quantity: item.quantity,
          unit: item.unit,
        });
      }
    }

    // Sort by date (most recent first) and limit
    history.sort((a, b) => b.invoiceDate - a.invoiceDate);
    return history.slice(0, limit);
  },
});

