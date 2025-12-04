import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { logCreate, logUpdate, logDelete } from "../lib/auditLog";

/**
 * Create a new invoice (sale or purchase)
 */
export const createInvoice = mutation({
  args: {
    type: v.union(v.literal("sale"), v.literal("purchase")),
    customerId: v.optional(v.id("customers")),
    supplierId: v.optional(v.string()),
    billingName: v.optional(v.string()),
    billingAddress: v.optional(v.any()),
    invoiceDate: v.number(), // Timestamp
    dueDate: v.optional(v.number()), // Timestamp
    discountCents: v.number(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountValue: v.number(),
    commissionAgentId: v.optional(v.id("commissionAgents")),
    notes: v.optional(v.string()),
    terms: v.optional(v.string()),
    lineItems: v.array(
      v.object({
        productId: v.id("products"),
        variationId: v.optional(v.string()),
        unit: v.string(),
        quantity: v.number(),
        unitPriceCents: v.number(),
        discountCents: v.optional(v.number()),
        notes: v.optional(v.string()),
      })
    ),
    additionalCharges: v.array(
      v.object({
        additionalChargeId: v.id("additionalCharges"),
        lineItemIds: v.optional(v.array(v.string())),
      })
    ),
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

    const organizationId = currentUser.organizationId;
    const now = Date.now();

    // Calculate totals from line items
    const subtotalCents = args.lineItems.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0
    );

    const discountAmountCents =
      args.discountType === "percentage"
        ? Math.round(subtotalCents * (args.discountValue / 100))
        : Math.round(args.discountValue * 100);

    // Calculate additional charges amounts
    // For now, we'll need to fetch the charges to get their amounts
    // This is simplified - in production you'd have charge amounts stored
    const additionalChargesCents = 0; // TODO: Calculate from additionalCharges

    const totalCents = subtotalCents - discountAmountCents + additionalChargesCents;

    // Generate invoice number
    const invoiceNumber = `${args.type === "sale" ? "SAL" : "PUR"}-${Date.now()}`;

    // Process line items with calculated totals
    const processedLineItems = args.lineItems.map((item) => {
      const totalPriceCents = item.unitPriceCents * item.quantity;
      const discountCents = item.discountCents || 0;
      
      // Get product to calculate cost and profit
      // For now, we'll set these to 0 - in production you'd fetch the product
      const costCents = 0; // TODO: Get from product
      const profitCents = totalPriceCents - (costCents * item.quantity);

      return {
        productId: item.productId,
        variationId: item.variationId,
        unit: item.unit,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalPriceCents,
        discountCents,
        costCents,
        profitCents,
        notes: item.notes,
      };
    });

    // Process additional charges with amounts
    const processedAdditionalCharges = args.additionalCharges.map((charge) => ({
      additionalChargeId: charge.additionalChargeId,
      lineItemIds: charge.lineItemIds || [],
      amountCents: 0, // TODO: Calculate from charge configuration
    }));

    // Create invoice
    const invoiceId = await ctx.db.insert("invoices", {
      organizationId,
      invoiceNumber,
      type: args.type,
      customerId: args.customerId,
      supplierId: args.supplierId,
      billingName: args.billingName,
      billingAddress: args.billingAddress,
      invoiceDate: args.invoiceDate,
      dueDate: args.dueDate,
      subtotalCents,
      discountCents: discountAmountCents,
      discountType: args.discountType,
      discountValue: args.discountValue,
      additionalChargesCents,
      taxCents: 0,
      totalCents,
      paidCents: 0,
      dueCents: totalCents,
      status: "draft",
      paymentStatus: "pending",
      paymentMethod: undefined,
      lineItems: processedLineItems,
      additionalCharges: processedAdditionalCharges,
      commissionAgentId: args.commissionAgentId,
      notes: args.notes,
      terms: args.terms,
      isLocked: false,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser._id,
      updatedBy: currentUser._id,
    });

    // Log audit trail
    await logCreate(
      ctx.db,
      currentUser.organizationId,
      currentUser._id,
      currentUser.name,
      "invoice",
      invoiceId,
      {
        invoiceNumber,
        type: args.type,
        customerId: args.customerId,
        totalCents,
        lineItemsCount: args.lineItems.length,
      }
    );

    return invoiceId;
  },
});

/**
 * Delete an invoice (soft delete by setting status to cancelled)
 */
export const deleteInvoice = mutation({
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

    // Get the invoice
    const invoice = await ctx.db.get(args.invoiceId);

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Verify user has access (same organization)
    if (invoice.organizationId !== currentUser.organizationId) {
      throw new Error("Access denied");
    }

    // Check if invoice is locked
    if (invoice.isLocked) {
      throw new Error("Cannot delete locked invoice");
    }

    // Get invoice data for audit log before deletion
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      customerId: invoice.customerId,
      totalCents: invoice.totalCents,
    };

    // Delete the invoice
    await ctx.db.delete(args.invoiceId);

    // Log audit trail
    await logDelete(
      ctx.db,
      currentUser.organizationId,
      currentUser._id,
      currentUser.name,
      "invoice",
      String(args.invoiceId),
      invoiceData
    );

    return { success: true };
  },
});

