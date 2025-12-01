import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all units for an organization
 */
export const getUnits = query({
  args: {
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user
    let currentUser = null;
    if (args.userEmail) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.userEmail!))
        .first();
    }

    if (!currentUser) {
      return [];
    }

    const units = await ctx.db
      .query("units")
      .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return units;
  },
});

/**
 * Get a single unit by ID
 */
export const getUnit = query({
  args: {
    unitId: v.id("units"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const unit = await ctx.db.get(args.unitId);
    return unit;
  },
});

/**
 * Get all unit conversions for an organization
 */
export const getUnitConversions = query({
  args: {
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user
    let currentUser = null;
    if (args.userEmail) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.userEmail!))
        .first();
    }

    if (!currentUser) {
      return [];
    }

    const conversions = await ctx.db
      .query("unitConversions")
      .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Populate unit details
    const conversionsWithUnits = await Promise.all(
      conversions.map(async (conv) => {
        const baseUnit = await ctx.db.get(conv.baseUnitId);
        const secondaryUnit = await ctx.db.get(conv.secondaryUnitId);
        return {
          ...conv,
          baseUnit,
          secondaryUnit,
        };
      })
    );

    return conversionsWithUnits;
  },
});

/**
 * Get unit conversions by base unit
 */
export const getUnitConversionsByBaseUnit = query({
  args: {
    baseUnitId: v.id("units"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const conversions = await ctx.db
      .query("unitConversions")
      .withIndex("by_base_unit", (q) => q.eq("baseUnitId", args.baseUnitId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Populate unit details
    const conversionsWithUnits = await Promise.all(
      conversions.map(async (conv) => {
        const baseUnit = await ctx.db.get(conv.baseUnitId);
        const secondaryUnit = await ctx.db.get(conv.secondaryUnitId);
        return {
          ...conv,
          baseUnit,
          secondaryUnit,
        };
      })
    );

    return conversionsWithUnits;
  },
});

