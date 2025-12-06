import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission } from "../lib/permissionChecker";

/**
 * Create a new user
 */
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    organizationId: v.id("organizations"),
    roleIds: v.optional(v.array(v.id("roles"))),
    isActive: v.optional(v.boolean()),
    authProvider: v.union(v.literal("email"), v.literal("google"), v.literal("github")),
    authProviderId: v.string(),
    passwordHash: v.optional(v.string()), // Hashed password (hashed on client using action)
    userEmail: v.optional(v.string()), // Email of current user (from NextAuth session)
  },
  handler: async (ctx, args) => {
    // Get current user - try Convex Auth first, then fallback to email lookup
    let currentUser = null;
    
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        currentUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
      }
    } catch {
      // Convex Auth not configured, use email from args
    }

    // Fallback: Use email from args (NextAuth session)
    if (!currentUser && args.userEmail) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.userEmail!))
        .first();
    }

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Super admin bypasses all permission checks
    if (!currentUser.isSuperAdmin) {
      const canCreate = await hasPermission(ctx, {
        module: "users",
        action: "create",
        userId: currentUser._id,
        organizationId: currentUser.organizationId,
      });

      if (!canCreate) {
        throw new Error("Permission denied");
      }
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      organizationId: args.organizationId,
      emailVerified: false,
      authProvider: args.authProvider,
      authProviderId: args.authProviderId,
      passwordHash: args.passwordHash, // Store hashed password if provided
      isActive: args.isActive ?? true,
      isSuperAdmin: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Assign roles
    if (args.roleIds && args.roleIds.length > 0) {
      for (const roleId of args.roleIds) {
        await ctx.db.insert("userRoles", {
          userId,
          roleId,
          assignedAt: Date.now(),
          assignedBy: currentUser._id,
          isActive: true,
        });
      }
    }

    // Create audit log
    await ctx.db.insert("rbacAuditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "user_created",
      entityType: "user",
      entityId: userId,
      changes: {
        email: args.email,
        name: args.name,
      },
      timestamp: Date.now(),
    });

    return userId;
  },
});

/**
 * Update user
 */
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    roleIds: v.optional(v.array(v.id("roles"))),
    passwordHash: v.optional(v.string()), // Hashed password (hashed on client using action)
    userEmail: v.optional(v.string()), // Email of current user (from NextAuth session)
  },
  handler: async (ctx, args) => {
    // Get current user - try Convex Auth first, then fallback to email lookup
    let currentUser = null;
    
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        currentUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
      }
    } catch {
      // Convex Auth not configured, use email from args
    }

    // Fallback: Use email from args (NextAuth session)
    if (!currentUser && args.userEmail) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.userEmail!))
        .first();
    }

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Super admin bypasses all permission checks
    // Otherwise, check permission (can edit own profile or has edit permission)
    const canEdit = currentUser.isSuperAdmin ||
      currentUser._id === args.userId ||
      (await hasPermission(ctx, {
        module: "users",
        action: "edit",
        userId: currentUser._id,
        organizationId: currentUser.organizationId,
      }));

    if (!canEdit) {
      throw new Error("Permission denied");
    }

    const changes: Record<string, any> = {};

    // Update user
    if (args.name !== undefined) {
      changes.name = args.name;
      await ctx.db.patch(args.userId, { name: args.name });
    }

    if (args.isActive !== undefined) {
      changes.isActive = args.isActive;
      await ctx.db.patch(args.userId, {
        isActive: args.isActive,
        updatedAt: Date.now(),
      });
    }

    // Update password if provided
    if (args.passwordHash !== undefined) {
      changes.passwordUpdated = true; // Don't log actual password hash
      await ctx.db.patch(args.userId, {
        passwordHash: args.passwordHash,
        updatedAt: Date.now(),
      });
    }

    // Update roles
    if (args.roleIds !== undefined) {
      // Remove existing roles
      const existingRoles = await ctx.db
        .query("userRoles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      for (const userRole of existingRoles) {
        await ctx.db.patch(userRole._id, { isActive: false });
      }

      // Add new roles
      for (const roleId of args.roleIds) {
        await ctx.db.insert("userRoles", {
          userId: args.userId,
          roleId,
          assignedAt: Date.now(),
          assignedBy: currentUser._id,
          isActive: true,
        });
      }

      changes.roles = args.roleIds;
    }

    // Create audit log
    await ctx.db.insert("rbacAuditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "user_updated",
      entityType: "user",
      entityId: args.userId,
      changes,
      timestamp: Date.now(),
    });

    return args.userId;
  },
});

/**
 * Delete user
 */
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get current user - try Convex Auth first, then fallback to email lookup
    let currentUser = null;
    
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        currentUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
      }
    } catch {
      // Convex Auth not configured
    }

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Cannot delete yourself
    if (currentUser._id === args.userId) {
      throw new Error("Cannot delete your own account");
    }

    // Super admin bypasses all permission checks
    if (!currentUser.isSuperAdmin) {
      const canDelete = await hasPermission(ctx, {
        module: "users",
        action: "delete",
        userId: currentUser._id,
        organizationId: currentUser.organizationId,
      });

      if (!canDelete) {
        throw new Error("Permission denied");
      }
    }

    // Soft delete - mark as inactive
    await ctx.db.patch(args.userId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Deactivate all role assignments
    const userRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const userRole of userRoles) {
      await ctx.db.patch(userRole._id, { isActive: false });
    }

    // Create audit log
    await ctx.db.insert("rbacAuditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "user_deleted",
      entityType: "user",
      entityId: args.userId,
      timestamp: Date.now(),
    });

    return args.userId;
  },
});


