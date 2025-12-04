import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { logCreate, logUpdate, logDelete } from "../lib/auditLog";

/**
 * Create a new additional charge (name only)
 */
export const createAdditionalCharge = mutation({
  args: {
    name: v.string(),
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
      throw new Error("Not authenticated");
    }

    // Check if charge with same name exists
    const existing = await ctx.db
      .query("additionalCharges")
      .withIndex("by_organization_name", (q) =>
        q.eq("organizationId", currentUser.organizationId).eq("name", args.name)
      )
      .first();

    if (existing) {
      throw new Error("Additional charge with this name already exists");
    }

    const chargeId = await ctx.db.insert("additionalCharges", {
      organizationId: currentUser.organizationId,
      name: args.name,
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
      "additionalCharges",
      chargeId,
      {
        name: args.name,
        isActive: true,
      }
    );

    return chargeId;
  },
});

/**
 * Update an additional charge
 */
export const updateAdditionalCharge = mutation({
  args: {
    chargeId: v.id("additionalCharges"),
    name: v.string(),
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

    const charge = await ctx.db.get(args.chargeId);
    if (!charge) {
      throw new Error("Additional charge not found");
    }

    if (charge.organizationId !== currentUser.organizationId) {
      throw new Error("Not authorized");
    }

    const oldData = { name: charge.name, isActive: charge.isActive };

    await ctx.db.patch(args.chargeId, {
      name: args.name,
      isActive: args.isActive !== undefined ? args.isActive : charge.isActive,
      updatedAt: Date.now(),
      updatedBy: currentUser._id,
    });

    await logUpdate(
      ctx.db,
      currentUser.organizationId,
      currentUser._id,
      currentUser.name,
      "additionalCharges",
      args.chargeId,
      oldData,
      {
        name: args.name,
        isActive: args.isActive !== undefined ? args.isActive : charge.isActive,
      }
    );

    return args.chargeId;
  },
});

/**
 * Delete an additional charge
 */
export const deleteAdditionalCharge = mutation({
  args: {
    chargeId: v.id("additionalCharges"),
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

    const charge = await ctx.db.get(args.chargeId);
    if (!charge) {
      throw new Error("Additional charge not found");
    }

    if (charge.organizationId !== currentUser.organizationId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.chargeId);

    await logDelete(
      ctx.db,
      currentUser.organizationId,
      currentUser._id,
      currentUser.name,
      "additionalCharges",
      args.chargeId,
      { name: charge.name, isActive: charge.isActive }
    );

    return args.chargeId;
  },
});

