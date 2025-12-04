import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { logCreate, logUpdate, logDelete } from "../lib/auditLog";

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

    // Create audit log
    try {
      await logCreate(
        ctx.db,
        currentUser.organizationId,
        currentUser._id,
        currentUser.name,
        "godown",
        godownId,
        {
          name: args.name,
          code: args.code,
          location: args.location,
          description: args.description,
        },
        {
          excludeFields: ["createdAt", "updatedAt", "createdBy", "organizationId", "_id", "_creationTime"],
        }
      );
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }

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

    // Store old data for audit log
    const oldData = {
      name: godown.name,
      code: godown.code,
      location: godown.location,
      description: godown.description,
      isActive: godown.isActive,
    };

    await ctx.db.patch(args.godownId, {
      name: args.name ?? godown.name,
      code: args.code ?? godown.code,
      location: args.location ?? godown.location,
      description: args.description ?? godown.description,
      isActive: args.isActive ?? godown.isActive,
      updatedAt: Date.now(),
    });

    // Create audit log
    try {
      const newData = {
        name: args.name ?? godown.name,
        code: args.code ?? godown.code,
        location: args.location ?? godown.location,
        description: args.description ?? godown.description,
        isActive: args.isActive ?? godown.isActive,
      };

      await logUpdate(
        ctx.db,
        currentUser.organizationId,
        currentUser._id,
        currentUser.name,
        "godown",
        args.godownId,
        oldData,
        newData,
        {
          excludeFields: ["updatedAt", "_id", "_creationTime"],
        }
      );
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }

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

    // Store godown data for audit log
    const godownData = {
      name: godown.name,
      code: godown.code,
      location: godown.location,
      description: godown.description,
      isActive: godown.isActive,
    };

    // Soft delete
    await ctx.db.patch(args.godownId, {
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
        "godown",
        args.godownId,
        godownData,
        {
          excludeFields: ["createdAt", "updatedAt", "createdBy", "organizationId", "_id", "_creationTime"],
        }
      );
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }

    return args.godownId;
  },
});

