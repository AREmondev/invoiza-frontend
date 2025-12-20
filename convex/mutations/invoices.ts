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
    paymentMethod: v.optional(v.string()),
    paymentAmountCents: v.optional(v.number()), // Payment amount in cents
    paymentStatus: v.optional(v.union(v.literal("pending"), v.literal("partial"), v.literal("paid"), v.literal("overpaid"))),
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

    // Handle payment amount and status
    const paymentAmountCents = args.paymentAmountCents || 0;
    const paymentStatus = args.paymentStatus || (paymentAmountCents >= totalCents ? (paymentAmountCents > totalCents ? "overpaid" : "paid") : (paymentAmountCents > 0 ? "partial" : "pending"));
    const paidCents = paymentAmountCents;
    const dueCents = Math.max(0, totalCents - paidCents);

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
            paidCents,
            dueCents,
            status: "draft",
            paymentStatus,
            paymentMethod: args.paymentMethod,
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

    // Create payment record if payment was made during invoice creation
    if (paymentAmountCents > 0 && args.paymentMethod) {
      await ctx.db.insert("payments", {
        organizationId,
        invoiceId,
        customerId: args.customerId,
        amountCents: paymentAmountCents,
        paymentMethod: args.paymentMethod,
        reference: undefined,
        notes: args.notes || undefined,
        paymentDate: args.invoiceDate, // Use invoice date as payment date
        status: "completed",
        processedBy: currentUser._id,
        createdAt: now,
        updatedAt: now,
        createdBy: currentUser._id,
        updatedBy: currentUser._id,
      });
    }

    // Update customer sales tracking if this is a sale
    if (args.type === "sale" && args.customerId) {
      const customer = await ctx.db.get(args.customerId);
      if (customer) {
        // Get all unpaid invoices for this customer to calculate next due date
        const unpaidInvoices = await ctx.db
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

        // Calculate next due date (earliest unpaid invoice due date)
        let nextDueDate: number | undefined = undefined;
        if (unpaidInvoices.length > 0) {
          const dueDates = unpaidInvoices
            .map(inv => inv.dueDate)
            .filter((date): date is number => date !== undefined)
            .sort((a, b) => a - b);
          if (dueDates.length > 0) {
            nextDueDate = dueDates[0];
          }
        }

        // Calculate totals - include the newly created invoice
        const allSales = await ctx.db
          .query("invoices")
          .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
          .filter((q) => q.eq(q.field("type"), "sale"))
          .collect();

        const totalSalesCents = allSales.reduce((sum, inv) => sum + inv.totalCents, 0);
        const totalDueCents = unpaidInvoices.reduce((sum, inv) => sum + inv.dueCents, 0);
        const totalSalesCount = allSales.length;
        const lastSaleDate = args.invoiceDate; // Current sale is the latest

        // Update customer record
        await ctx.db.patch(args.customerId, {
          totalSalesCents: totalSalesCents || 0,
          totalSalesCount: totalSalesCount || 0,
          totalDueCents: totalDueCents || 0,
          lastSaleDate,
          nextDueDate,
          updatedAt: now,
          updatedBy: currentUser._id,
        });
      }
    }

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

    // Update customer sales tracking if this was a sale
    if (invoice.type === "sale" && invoice.customerId) {
      // Recalculate customer stats
      const allSales = await ctx.db
        .query("invoices")
        .withIndex("by_customer", (q) => q.eq("customerId", invoice.customerId!))
        .filter((q) => q.eq(q.field("type"), "sale"))
        .collect();

      const unpaidInvoices = allSales.filter(inv => 
        inv.paymentStatus === "pending" || inv.paymentStatus === "partial"
      );

      const totalSalesCents = allSales.reduce((sum, inv) => sum + inv.totalCents, 0);
      const totalDueCents = unpaidInvoices.reduce((sum, inv) => sum + inv.dueCents, 0);
      const totalSalesCount = allSales.length;
      
      // Get last sale date
      const lastSaleDate = allSales.length > 0 
        ? Math.max(...allSales.map(inv => inv.invoiceDate))
        : undefined;

      // Calculate next due date
      let nextDueDate: number | undefined = undefined;
      if (unpaidInvoices.length > 0) {
        const dueDates = unpaidInvoices
          .map(inv => inv.dueDate)
          .filter((date): date is number => date !== undefined)
          .sort((a, b) => a - b);
        if (dueDates.length > 0) {
          nextDueDate = dueDates[0];
        }
      }

      // Update customer record
      await ctx.db.patch(invoice.customerId, {
        totalSalesCents,
        totalSalesCount,
        totalDueCents,
        lastSaleDate,
        nextDueDate,
        updatedAt: Date.now(),
        updatedBy: currentUser._id,
      });
    }

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

