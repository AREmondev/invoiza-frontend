import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { logCreate, logUpdate, logDelete } from "../lib/auditLog";

/**
 * Create a new payment method
 */
export const createPaymentMethod = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    type: v.union(
      v.literal("cash"),
      v.literal("bank"),
      v.literal("e_wallet"),
      v.literal("card"),
      v.literal("check"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
    // Bank-specific fields
    bankName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    accountHolderName: v.optional(v.string()),
    branchName: v.optional(v.string()),
    // E-wallet specific fields
    eWalletType: v.optional(v.string()),
    eWalletNumber: v.optional(v.string()),
    // Card specific fields
    cardType: v.optional(v.string()),
    cardLastFour: v.optional(v.string()),
    // Balance
    initialBalanceCents: v.optional(v.number()),
    sortOrder: v.optional(v.number()),
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
      throw new Error("Not authenticated");
    }

    // Check if payment method with same code exists
    const existing = await ctx.db
      .query("paymentMethods")
      .withIndex("by_organization_code", (q) =>
        q.eq("organizationId", currentUser.organizationId).eq("code", args.code)
      )
      .first();

    if (existing) {
      throw new Error("Payment method with this code already exists");
    }

    // Get max sortOrder to add new one at the end
    const allMethods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
      .collect();
    
    const maxSortOrder = allMethods.length > 0
      ? Math.max(...allMethods.map(m => m.sortOrder))
      : 0;

    const methodId = await ctx.db.insert("paymentMethods", {
      organizationId: currentUser.organizationId,
      name: args.name,
      code: args.code,
      type: args.type,
      description: args.description || undefined,
      bankName: args.bankName || undefined,
      accountNumber: args.accountNumber || undefined,
      accountHolderName: args.accountHolderName || undefined,
      branchName: args.branchName || undefined,
      eWalletType: args.eWalletType || undefined,
      eWalletNumber: args.eWalletNumber || undefined,
      cardType: args.cardType || undefined,
      cardLastFour: args.cardLastFour || undefined,
      balanceCents: args.initialBalanceCents || 0,
      initialBalanceCents: args.initialBalanceCents || 0,
      sortOrder: args.sortOrder ?? maxSortOrder + 1,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser._id,
      updatedBy: currentUser._id,
    });

    await logCreate(
      ctx.db,
      currentUser.organizationId,
      currentUser._id,
      currentUser.name,
      "paymentMethods",
      methodId,
      {
        name: args.name,
        code: args.code,
        type: args.type,
        description: args.description,
        bankName: args.bankName,
        accountNumber: args.accountNumber,
        eWalletType: args.eWalletType,
        eWalletNumber: args.eWalletNumber,
        initialBalanceCents: args.initialBalanceCents || 0,
        sortOrder: args.sortOrder ?? maxSortOrder + 1,
        isActive: true,
      }
    );

    return methodId;
  },
});

/**
 * Update a payment method
 */
export const updatePaymentMethod = mutation({
  args: {
    methodId: v.id("paymentMethods"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("cash"),
        v.literal("bank"),
        v.literal("e_wallet"),
        v.literal("card"),
        v.literal("check"),
        v.literal("other")
      )
    ),
    description: v.optional(v.string()),
    // Bank-specific fields
    bankName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    accountHolderName: v.optional(v.string()),
    branchName: v.optional(v.string()),
    // E-wallet specific fields
    eWalletType: v.optional(v.string()),
    eWalletNumber: v.optional(v.string()),
    // Card specific fields
    cardType: v.optional(v.string()),
    cardLastFour: v.optional(v.string()),
    // Balance
    balanceCents: v.optional(v.number()),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
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
      throw new Error("Not authenticated");
    }

    const method = await ctx.db.get(args.methodId);
    if (!method) {
      throw new Error("Payment method not found");
    }

    if (method.organizationId !== currentUser.organizationId) {
      throw new Error("Not authorized");
    }

    const oldData = {
      name: method.name,
      code: method.code,
      type: method.type,
      description: method.description,
      bankName: method.bankName,
      accountNumber: method.accountNumber,
      accountHolderName: method.accountHolderName,
      branchName: method.branchName,
      eWalletType: method.eWalletType,
      eWalletNumber: method.eWalletNumber,
      cardType: method.cardType,
      cardLastFour: method.cardLastFour,
      balanceCents: method.balanceCents,
      sortOrder: method.sortOrder,
      isActive: method.isActive,
    };

    // If code is being updated, check for duplicates
    if (args.code && args.code !== method.code) {
      const existing = await ctx.db
        .query("paymentMethods")
        .withIndex("by_organization_code", (q) =>
          q.eq("organizationId", currentUser.organizationId).eq("code", args.code)
        )
        .first();

      if (existing && existing._id !== args.methodId) {
        throw new Error("Payment method with this code already exists");
      }
    }

    await ctx.db.patch(args.methodId, {
      name: args.name !== undefined ? args.name : method.name,
      code: args.code !== undefined ? args.code : method.code,
      type: args.type !== undefined ? args.type : method.type,
      description: args.description !== undefined ? args.description : method.description,
      bankName: args.bankName !== undefined ? args.bankName : method.bankName,
      accountNumber: args.accountNumber !== undefined ? args.accountNumber : method.accountNumber,
      accountHolderName: args.accountHolderName !== undefined ? args.accountHolderName : method.accountHolderName,
      branchName: args.branchName !== undefined ? args.branchName : method.branchName,
      eWalletType: args.eWalletType !== undefined ? args.eWalletType : method.eWalletType,
      eWalletNumber: args.eWalletNumber !== undefined ? args.eWalletNumber : method.eWalletNumber,
      cardType: args.cardType !== undefined ? args.cardType : method.cardType,
      cardLastFour: args.cardLastFour !== undefined ? args.cardLastFour : method.cardLastFour,
      balanceCents: args.balanceCents !== undefined ? args.balanceCents : method.balanceCents,
      sortOrder: args.sortOrder !== undefined ? args.sortOrder : method.sortOrder,
      isActive: args.isActive !== undefined ? args.isActive : method.isActive,
      updatedAt: Date.now(),
      updatedBy: currentUser._id,
    });

    await logUpdate(
      ctx.db,
      currentUser.organizationId,
      currentUser._id,
      currentUser.name,
      "paymentMethods",
      args.methodId,
      oldData,
      {
        name: args.name !== undefined ? args.name : method.name,
        code: args.code !== undefined ? args.code : method.code,
        type: args.type !== undefined ? args.type : method.type,
        description: args.description !== undefined ? args.description : method.description,
        bankName: args.bankName !== undefined ? args.bankName : method.bankName,
        accountNumber: args.accountNumber !== undefined ? args.accountNumber : method.accountNumber,
        eWalletType: args.eWalletType !== undefined ? args.eWalletType : method.eWalletType,
        eWalletNumber: args.eWalletNumber !== undefined ? args.eWalletNumber : method.eWalletNumber,
        balanceCents: args.balanceCents !== undefined ? args.balanceCents : method.balanceCents,
        sortOrder: args.sortOrder !== undefined ? args.sortOrder : method.sortOrder,
        isActive: args.isActive !== undefined ? args.isActive : method.isActive,
      }
    );

    return args.methodId;
  },
});

/**
 * Delete a payment method
 */
export const deletePaymentMethod = mutation({
  args: {
    methodId: v.id("paymentMethods"),
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
      throw new Error("Not authenticated");
    }

    const method = await ctx.db.get(args.methodId);
    if (!method) {
      throw new Error("Payment method not found");
    }

    if (method.organizationId !== currentUser.organizationId) {
      throw new Error("Not authorized");
    }

    // Check if payment method is being used
    const allPayments = await ctx.db
      .query("payments")
      .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
      .collect();

    const paymentsUsingMethod = allPayments.filter((p) => p.paymentMethod === method.code);

    if (paymentsUsingMethod.length > 0) {
      throw new Error(`Cannot delete payment method that is being used in ${paymentsUsingMethod.length} payment(s)`);
    }

    await ctx.db.delete(args.methodId);

    await logDelete(
      ctx.db,
      currentUser.organizationId,
      currentUser._id,
      currentUser.name,
      "paymentMethods",
      args.methodId,
      {
        name: method.name,
        code: method.code,
        type: method.type,
        description: method.description,
        isActive: method.isActive,
      }
    );

    return args.methodId;
  },
});

