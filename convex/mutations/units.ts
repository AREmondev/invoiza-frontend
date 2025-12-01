import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a new unit
 */
export const createUnit = mutation({
  args: {
    name: v.string(),
    abbreviation: v.string(),
    description: v.optional(v.string()),
    isBaseUnit: v.optional(v.boolean()),
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

    // Check if unit with same name exists
    const existing = await ctx.db
      .query("units")
      .withIndex("by_organization_name", (q) =>
        q.eq("organizationId", currentUser.organizationId).eq("name", args.name)
      )
      .first();

    if (existing) {
      throw new Error("Unit with this name already exists");
    }

    const unitId = await ctx.db.insert("units", {
      organizationId: currentUser.organizationId,
      name: args.name,
      abbreviation: args.abbreviation,
      description: args.description,
      isBaseUnit: args.isBaseUnit ?? false,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser._id,
    });

    return unitId;
  },
});

/**
 * Update a unit
 */
export const updateUnit = mutation({
  args: {
    unitId: v.id("units"),
    name: v.optional(v.string()),
    abbreviation: v.optional(v.string()),
    description: v.optional(v.string()),
    isBaseUnit: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
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

    const unit = await ctx.db.get(args.unitId);
    if (!unit || unit.organizationId !== currentUser.organizationId) {
      throw new Error("Unit not found");
    }

    // Check name uniqueness if name is being updated
    if (args.name && args.name !== unit.name) {
      const existing = await ctx.db
        .query("units")
        .withIndex("by_organization_name", (q) =>
          q.eq("organizationId", currentUser.organizationId).eq("name", args.name!)
        )
        .first();

      if (existing) {
        throw new Error("Unit with this name already exists");
      }
    }

    await ctx.db.patch(args.unitId, {
      name: args.name ?? unit.name,
      abbreviation: args.abbreviation ?? unit.abbreviation,
      description: args.description ?? unit.description,
      isBaseUnit: args.isBaseUnit ?? unit.isBaseUnit,
      isActive: args.isActive ?? unit.isActive,
      updatedAt: Date.now(),
    });

    return args.unitId;
  },
});

/**
 * Delete a unit (soft delete)
 */
export const deleteUnit = mutation({
  args: {
    unitId: v.id("units"),
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

    const unit = await ctx.db.get(args.unitId);
    if (!unit || unit.organizationId !== currentUser.organizationId) {
      throw new Error("Unit not found");
    }

    // Soft delete
    await ctx.db.patch(args.unitId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.unitId;
  },
});

/**
 * Create a unit conversion (e.g., 1 box = 25 pcs)
 */
export const createUnitConversion = mutation({
  args: {
    baseUnitId: v.id("units"),
    secondaryUnitId: v.id("units"),
    conversionFactor: v.number(), // How many secondary units = 1 base unit
    description: v.optional(v.string()),
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

    if (args.baseUnitId === args.secondaryUnitId) {
      throw new Error("Base unit and secondary unit cannot be the same");
    }

    // Allow multiple conversions with same units but different conversion factors
    // Check if exact same conversion already exists (same units AND same factor)
    const existing = await ctx.db
      .query("unitConversions")
      .withIndex("by_units", (q) =>
        q.eq("baseUnitId", args.baseUnitId).eq("secondaryUnitId", args.secondaryUnitId)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("conversionFactor"), args.conversionFactor)
        )
      )
      .first();

    if (existing) {
      throw new Error("This exact unit conversion already exists (same units and conversion factor)");
    }

    const conversionId = await ctx.db.insert("unitConversions", {
      organizationId: currentUser.organizationId,
      baseUnitId: args.baseUnitId,
      secondaryUnitId: args.secondaryUnitId,
      conversionFactor: args.conversionFactor,
      description: args.description,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser._id,
    });

    return conversionId;
  },
});

/**
 * Update a unit conversion
 */
export const updateUnitConversion = mutation({
  args: {
    conversionId: v.id("unitConversions"),
    conversionFactor: v.optional(v.number()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
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

    const conversion = await ctx.db.get(args.conversionId);
    if (!conversion || conversion.organizationId !== currentUser.organizationId) {
      throw new Error("Unit conversion not found");
    }

    await ctx.db.patch(args.conversionId, {
      conversionFactor: args.conversionFactor ?? conversion.conversionFactor,
      description: args.description ?? conversion.description,
      isActive: args.isActive ?? conversion.isActive,
      updatedAt: Date.now(),
    });

    return args.conversionId;
  },
});

/**
 * Delete a unit conversion (soft delete)
 */
export const deleteUnitConversion = mutation({
  args: {
    conversionId: v.id("unitConversions"),
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

    const conversion = await ctx.db.get(args.conversionId);
    if (!conversion || conversion.organizationId !== currentUser.organizationId) {
      throw new Error("Unit conversion not found");
    }

    // Soft delete
    await ctx.db.patch(args.conversionId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.conversionId;
  },
});

