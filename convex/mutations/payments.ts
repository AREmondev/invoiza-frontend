import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { logCreate, logUpdate } from "../lib/auditLog";

/**
 * Create a payment for one or more invoices
 */
export const createPayment = mutation({
  args: {
    customerId: v.id("customers"),
    payments: v.array(
      v.object({
        invoiceId: v.id("invoices"),
        amountCents: v.number(),
        paymentMethod: v.string(),
        reference: v.optional(v.string()),
        notes: v.optional(v.string()),
        paymentDate: v.number(), // Timestamp
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

    // Verify customer access
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.organizationId !== organizationId) {
      throw new Error("Customer not found or access denied");
    }

    const createdPaymentIds: string[] = [];

    // Process each payment
    for (const paymentData of args.payments) {
      // Get invoice
      const invoice = await ctx.db.get(paymentData.invoiceId);
      if (!invoice) {
        throw new Error(`Invoice ${paymentData.invoiceId} not found`);
      }

      // Verify invoice belongs to customer and organization
      if (
        invoice.customerId !== args.customerId ||
        invoice.organizationId !== organizationId
      ) {
        throw new Error("Invoice access denied");
      }

      // Verify invoice is not locked
      if (invoice.isLocked) {
        throw new Error(`Invoice ${invoice.invoiceNumber} is locked`);
      }

      // Verify payment amount is positive
      if (paymentData.amountCents <= 0) {
        throw new Error("Payment amount must be greater than 0");
      }

      // Get existing payments for this invoice
      const existingPayments = await ctx.db
        .query("payments")
        .withIndex("by_invoice", (q) => q.eq("invoiceId", paymentData.invoiceId))
        .collect();

      const totalPaidCents =
        existingPayments.reduce((sum, p) => sum + p.amountCents, 0) +
        paymentData.amountCents;

      // Create payment record
      const paymentId = await ctx.db.insert("payments", {
        organizationId,
        invoiceId: paymentData.invoiceId,
        customerId: args.customerId,
        amountCents: paymentData.amountCents,
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference,
        notes: paymentData.notes,
        paymentDate: paymentData.paymentDate,
        status: "completed",
        processedBy: currentUser._id,
        createdAt: now,
        updatedAt: now,
        createdBy: currentUser._id,
        updatedBy: currentUser._id,
      });

      createdPaymentIds.push(paymentId);

      // Update payment method balance if it's a bank or cash payment method
      const paymentMethod = await ctx.db
        .query("paymentMethods")
        .withIndex("by_organization_code", (q) =>
          q.eq("organizationId", organizationId).eq("code", paymentData.paymentMethod)
        )
        .first();

      if (paymentMethod && (paymentMethod.type === "bank" || paymentMethod.type === "cash")) {
        // For sales (income), increase balance; for purchases (expense), decrease balance
        const isSale = invoice.type === "sale";
        const balanceChange = isSale ? paymentData.amountCents : -paymentData.amountCents;
        const newBalance = (paymentMethod.balanceCents || 0) + balanceChange;

        await ctx.db.patch(paymentMethod._id, {
          balanceCents: newBalance,
          updatedAt: now,
          updatedBy: currentUser._id,
        });
      }

      // Update invoice payment status
      let newPaymentStatus: "pending" | "partial" | "paid" | "overpaid";
      if (totalPaidCents >= invoice.totalCents) {
        newPaymentStatus = totalPaidCents > invoice.totalCents ? "overpaid" : "paid";
      } else {
        newPaymentStatus = totalPaidCents > 0 ? "partial" : "pending";
      }

      const newPaidCents = totalPaidCents;
      const newDueCents = Math.max(0, invoice.totalCents - newPaidCents);

      // Update invoice
      await ctx.db.patch(paymentData.invoiceId, {
        paidCents: newPaidCents,
        dueCents: newDueCents,
        paymentStatus: newPaymentStatus,
        updatedAt: now,
        updatedBy: currentUser._id,
      });

      // Log audit trail for invoice update
      await logUpdate(
        ctx.db,
        organizationId,
        currentUser._id,
        currentUser.name,
        "invoice",
        String(paymentData.invoiceId),
        [
          {
            field: "paidCents",
            oldValue: invoice.paidCents,
            newValue: newPaidCents,
            dataType: "number",
          },
          {
            field: "dueCents",
            oldValue: invoice.dueCents,
            newValue: newDueCents,
            dataType: "number",
          },
          {
            field: "paymentStatus",
            oldValue: invoice.paymentStatus,
            newValue: newPaymentStatus,
            dataType: "string",
          },
        ]
      );

      // Log audit trail for payment creation
      await logCreate(
        ctx.db,
        organizationId,
        currentUser._id,
        currentUser.name,
        "payment",
        paymentId,
        {
          invoiceId: paymentData.invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          customerId: args.customerId,
          amountCents: paymentData.amountCents,
          paymentMethod: paymentData.paymentMethod,
        }
      );
    }

    // Update customer totals
    const allSales = await ctx.db
      .query("invoices")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .filter((q) => q.eq(q.field("type"), "sale"))
      .collect();

    const unpaidInvoices = allSales.filter(
      (inv) => inv.paymentStatus === "pending" || inv.paymentStatus === "partial"
    );

    // Get all payments for this customer to calculate totals
    const allPayments = await ctx.db
      .query("payments")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();

    const totalSalesCents = allSales.reduce((sum, inv) => sum + inv.totalCents, 0);
    const totalDueCents = unpaidInvoices.reduce((sum, inv) => sum + inv.dueCents, 0);
    const totalSalesCount = allSales.length;

    // Get last sale date
    const lastSaleDate =
      allSales.length > 0
        ? Math.max(...allSales.map((inv) => inv.invoiceDate))
        : undefined;

    // Calculate next due date (earliest unpaid invoice due date)
    let nextDueDate: number | undefined = undefined;
    if (unpaidInvoices.length > 0) {
      const dueDates = unpaidInvoices
        .map((inv) => inv.dueDate)
        .filter((date): date is number => date !== undefined)
        .sort((a, b) => a - b);
      if (dueDates.length > 0) {
        nextDueDate = dueDates[0];
      }
    }

    // Update customer record
    await ctx.db.patch(args.customerId, {
      totalSalesCents,
      totalSalesCount,
      totalDueCents,
      lastSaleDate,
      nextDueDate,
      updatedAt: now,
      updatedBy: currentUser._id,
    });

    return {
      success: true,
      paymentIds: createdPaymentIds,
    };
  },
});

