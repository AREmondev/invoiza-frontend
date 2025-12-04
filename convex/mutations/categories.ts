import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { logCreate, logUpdate, logDelete } from "../lib/auditLog";

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

    // Create audit log
    try {
      await logCreate(
        ctx.db,
        currentUser.organizationId,
        currentUser._id,
        currentUser.name,
        "category",
        categoryId,
        {
          name: args.name,
          code: args.code,
          description: args.description,
          parentId: args.parentId,
        },
        {
          excludeFields: ["createdAt", "updatedAt", "createdBy", "organizationId", "_id", "_creationTime"],
        }
      );
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }

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

    // Store old data for audit log
    const oldData = {
      name: category.name,
      code: category.code,
      description: category.description,
      parentId: category.parentId,
      isActive: category.isActive,
    };

    await ctx.db.patch(args.categoryId, {
      name: args.name ?? category.name,
      code: args.code ?? category.code,
      description: args.description ?? category.description,
      parentId: args.parentId ?? category.parentId,
      isActive: args.isActive ?? category.isActive,
      updatedAt: Date.now(),
    });

    // Create audit log
    try {
      const newData = {
        name: args.name ?? category.name,
        code: args.code ?? category.code,
        description: args.description ?? category.description,
        parentId: args.parentId ?? category.parentId,
        isActive: args.isActive ?? category.isActive,
      };

      await logUpdate(
        ctx.db,
        currentUser.organizationId,
        currentUser._id,
        currentUser.name,
        "category",
        args.categoryId,
        oldData,
        newData,
        {
          excludeFields: ["updatedAt", "_id", "_creationTime"],
        }
      );
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }

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

    // Store category data for audit log
    const categoryData = {
      name: category.name,
      code: category.code,
      description: category.description,
      parentId: category.parentId,
      isActive: category.isActive,
    };

    // Soft delete
    await ctx.db.patch(args.categoryId, {
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
        "category",
        args.categoryId,
        categoryData,
        {
          excludeFields: ["createdAt", "updatedAt", "createdBy", "organizationId", "_id", "_creationTime"],
        }
      );
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }

    return args.categoryId;
  },
});

