import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a new category
 */
export const createCategory = mutation({
  args: {
    name: v.string(),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
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

    // Check if category with same name exists
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_organization_name", (q) =>
        q.eq("organizationId", currentUser.organizationId).eq("name", args.name)
      )
      .first();

    if (existing) {
      throw new Error("Category with this name already exists");
    }

    const categoryId = await ctx.db.insert("categories", {
      organizationId: currentUser.organizationId,
      name: args.name,
      code: args.code,
      description: args.description,
      parentId: args.parentId,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser._id,
    });

    return categoryId;
  },
});

/**
 * Update a category
 */
export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
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

    const category = await ctx.db.get(args.categoryId);
    if (!category || category.organizationId !== currentUser.organizationId) {
      throw new Error("Category not found");
    }

    // Check name uniqueness if name is being updated
    if (args.name && args.name !== category.name) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_organization_name", (q) =>
          q.eq("organizationId", currentUser.organizationId).eq("name", args.name!)
        )
        .first();

      if (existing) {
        throw new Error("Category with this name already exists");
      }
    }

    await ctx.db.patch(args.categoryId, {
      name: args.name ?? category.name,
      code: args.code ?? category.code,
      description: args.description ?? category.description,
      parentId: args.parentId ?? category.parentId,
      isActive: args.isActive ?? category.isActive,
      updatedAt: Date.now(),
    });

    return args.categoryId;
  },
});

/**
 * Delete a category (soft delete)
 */
export const deleteCategory = mutation({
  args: {
    categoryId: v.id("categories"),
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

    const category = await ctx.db.get(args.categoryId);
    if (!category || category.organizationId !== currentUser.organizationId) {
      throw new Error("Category not found");
    }

    // Soft delete
    await ctx.db.patch(args.categoryId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.categoryId;
  },
});

