import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { logCreate, logUpdate, logDelete } from "../lib/auditLog";

/**
 * Create a new brand
 */
export const createBrand = mutation({
  args: {
    name: v.string(),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
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

    // Check if brand with same name exists
    const existing = await ctx.db
      .query("brands")
      .withIndex("by_organization_name", (q) =>
        q.eq("organizationId", currentUser.organizationId).eq("name", args.name)
      )
      .first();

    if (existing) {
      throw new Error("Brand with this name already exists");
    }

    const brandId = await ctx.db.insert("brands", {
      organizationId: currentUser.organizationId,
      name: args.name,
      code: args.code,
      description: args.description,
      manufacturer: args.manufacturer,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser._id,
    });

    // Create audit log
    try {
      await logCreate(
        ctx.db,
        currentUser.organizationId,
        currentUser._id,
        currentUser.name,
        "brand",
        brandId,
        {
          name: args.name,
          code: args.code,
          description: args.description,
          manufacturer: args.manufacturer,
        },
        {
          excludeFields: ["createdAt", "updatedAt", "createdBy", "organizationId", "_id", "_creationTime"],
        }
      );
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }

    return brandId;
  },
});

/**
 * Update a brand
 */
export const updateBrand = mutation({
  args: {
    brandId: v.id("brands"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
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

    const brand = await ctx.db.get(args.brandId);
    if (!brand || brand.organizationId !== currentUser.organizationId) {
      throw new Error("Brand not found");
    }

    // Check name uniqueness if name is being updated
    if (args.name && args.name !== brand.name) {
      const existing = await ctx.db
        .query("brands")
        .withIndex("by_organization_name", (q) =>
          q.eq("organizationId", currentUser.organizationId).eq("name", args.name!)
        )
        .first();

      if (existing) {
        throw new Error("Brand with this name already exists");
      }
    }

    // Store old data for audit log
    const oldData = {
      name: brand.name,
      code: brand.code,
      description: brand.description,
      manufacturer: brand.manufacturer,
      isActive: brand.isActive,
    };

    await ctx.db.patch(args.brandId, {
      name: args.name ?? brand.name,
      code: args.code ?? brand.code,
      description: args.description ?? brand.description,
      manufacturer: args.manufacturer ?? brand.manufacturer,
      isActive: args.isActive ?? brand.isActive,
      updatedAt: Date.now(),
    });

    // Create audit log
    try {
      const newData = {
        name: args.name ?? brand.name,
        code: args.code ?? brand.code,
        description: args.description ?? brand.description,
        manufacturer: args.manufacturer ?? brand.manufacturer,
        isActive: args.isActive ?? brand.isActive,
      };

      await logUpdate(
        ctx.db,
        currentUser.organizationId,
        currentUser._id,
        currentUser.name,
        "brand",
        args.brandId,
        oldData,
        newData,
        {
          excludeFields: ["updatedAt", "_id", "_creationTime"],
        }
      );
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }

    return args.brandId;
  },
});

/**
 * Delete a brand (soft delete by setting isActive to false)
 */
export const deleteBrand = mutation({
  args: {
    brandId: v.id("brands"),
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

    const brand = await ctx.db.get(args.brandId);
    if (!brand || brand.organizationId !== currentUser.organizationId) {
      throw new Error("Brand not found");
    }

    // Store brand data for audit log
    const brandData = {
      name: brand.name,
      code: brand.code,
      description: brand.description,
      manufacturer: brand.manufacturer,
      isActive: brand.isActive,
    };

    // Soft delete
    await ctx.db.patch(args.brandId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Create audit log
    try {
      await logDelete(
        ctx.db,
        currentUser.organizationId,
        currentUser._id,
        currentUser.name,
        "brand",
        args.brandId,
        brandData,
        {
          excludeFields: ["createdAt", "updatedAt", "createdBy", "organizationId", "_id", "_creationTime"],
        }
      );
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }

    return args.brandId;
  },
});

