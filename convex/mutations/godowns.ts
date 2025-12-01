import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a new godown
 */
export const createGodown = mutation({
  args: {
    name: v.string(),
    code: v.optional(v.string()),
    location: v.optional(v.string()),
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

    // Check if godown with same name exists
    const existing = await ctx.db
      .query("godowns")
      .withIndex("by_organization_name", (q) =>
        q.eq("organizationId", currentUser.organizationId).eq("name", args.name)
      )
      .first();

    if (existing) {
      throw new Error("Godown with this name already exists");
    }

    const godownId = await ctx.db.insert("godowns", {
      organizationId: currentUser.organizationId,
      name: args.name,
      code: args.code,
      location: args.location,
      description: args.description,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser._id,
    });

    return godownId;
  },
});

/**
 * Update a godown
 */
export const updateGodown = mutation({
  args: {
    godownId: v.id("godowns"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    location: v.optional(v.string()),
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

    const godown = await ctx.db.get(args.godownId);
    if (!godown || godown.organizationId !== currentUser.organizationId) {
      throw new Error("Godown not found");
    }

    // Check name uniqueness if name is being updated
    if (args.name && args.name !== godown.name) {
      const existing = await ctx.db
        .query("godowns")
        .withIndex("by_organization_name", (q) =>
          q.eq("organizationId", currentUser.organizationId).eq("name", args.name!)
        )
        .first();

      if (existing) {
        throw new Error("Godown with this name already exists");
      }
    }

    await ctx.db.patch(args.godownId, {
      name: args.name ?? godown.name,
      code: args.code ?? godown.code,
      location: args.location ?? godown.location,
      description: args.description ?? godown.description,
      isActive: args.isActive ?? godown.isActive,
      updatedAt: Date.now(),
    });

    return args.godownId;
  },
});

/**
 * Delete a godown (soft delete)
 */
export const deleteGodown = mutation({
  args: {
    godownId: v.id("godowns"),
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

    const godown = await ctx.db.get(args.godownId);
    if (!godown || godown.organizationId !== currentUser.organizationId) {
      throw new Error("Godown not found");
    }

    // Soft delete
    await ctx.db.patch(args.godownId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.godownId;
  },
});

