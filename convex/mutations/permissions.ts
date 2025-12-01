import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { PERMISSION_DEFINITIONS } from "../lib/permissions";
import { hasPermission } from "../lib/permissionChecker";

/**
 * Seed permissions (run once to initialize)
 */
export const seedPermissions = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if permissions already exist
    const existingPermissions = await ctx.db.query("permissions").first();
    if (existingPermissions) {
      return { message: "Permissions already seeded" };
    }

    // Create all permissions
    const permissionIds = [];
    for (const perm of PERMISSION_DEFINITIONS) {
      const permissionId = await ctx.db.insert("permissions", {
        module: perm.module,
        action: perm.action,
        displayName: perm.displayName,
        description: perm.description,
        category: perm.category,
        scope: perm.scope,
        isSystem: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      permissionIds.push(permissionId);
    }

    return {
      message: `Created ${permissionIds.length} permissions`,
      count: permissionIds.length,
    };
  },
});

/**
 * Create custom permission
 */
export const createCustomPermission = mutation({
  args: {
    module: v.string(),
    action: v.union(
      v.literal("view"),
      v.literal("create"),
      v.literal("edit"),
      v.literal("delete"),
      v.literal("export"),
      v.literal("approve"),
      v.literal("custom")
    ),
    customAction: v.optional(v.string()),
    displayName: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    scope: v.union(
      v.literal("global"),
      v.literal("own"),
      v.literal("team"),
      v.literal("department")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only super admin can create custom permissions
    if (!currentUser.isSuperAdmin) {
      throw new Error("Permission denied - only super admin can create custom permissions");
    }

    // Check if permission already exists
    let existingPermission;
    if (args.action === "custom" && args.customAction) {
      existingPermission = await ctx.db
        .query("permissions")
        .withIndex("by_module", (q) => q.eq("module", args.module))
        .filter((q) =>
          q.and(
            q.eq(q.field("action"), args.action),
            q.eq(q.field("customAction"), args.customAction)
          )
        )
        .first();
    } else {
      existingPermission = await ctx.db
        .query("permissions")
        .withIndex("by_module_action", (q) =>
          q.eq("module", args.module).eq("action", args.action)
        )
        .first();
    }

    if (existingPermission) {
      throw new Error("Permission already exists");
    }

    const permissionId = await ctx.db.insert("permissions", {
      module: args.module,
      action: args.action,
      customAction: args.customAction,
      displayName: args.displayName,
      description: args.description,
      category: args.category,
      scope: args.scope,
      isSystem: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return permissionId;
  },
});

/**
 * Assign permission to role
 */
export const assignPermissionToRole = mutation({
  args: {
    roleId: v.id("roles"),
    permissionId: v.id("permissions"),
    conditions: v.optional(
      v.object({
        fields: v.optional(v.array(v.string())),
        custom: v.optional(v.string()),
      })
    ),
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
      const canEdit = await hasPermission(ctx, {
        module: "permissions",
        action: "edit",
        userId: currentUser._id,
        organizationId: currentUser.organizationId,
      });

      if (!canEdit) {
        throw new Error("Permission denied");
      }
    }

    // Check if already assigned
    const existing = await ctx.db
      .query("rolePermissions")
      .withIndex("by_role_permission", (q) =>
        q.eq("roleId", args.roleId).eq("permissionId", args.permissionId)
      )
      .first();

    if (existing) {
      throw new Error("Permission already assigned to role");
    }

    const rolePermissionId = await ctx.db.insert("rolePermissions", {
      roleId: args.roleId,
      permissionId: args.permissionId,
      conditions: args.conditions,
      createdAt: Date.now(),
      createdBy: currentUser._id,
    });

    // Create audit log
    await ctx.db.insert("rbacAuditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "permission_granted",
      entityType: "permission",
      entityId: args.permissionId,
      changes: {
        roleId: args.roleId,
      },
      timestamp: Date.now(),
    });

    return rolePermissionId;
  },
});

/**
 * Revoke permission from role
 */
export const revokePermissionFromRole = mutation({
  args: {
    roleId: v.id("roles"),
    permissionId: v.id("permissions"),
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
      const canEdit = await hasPermission(ctx, {
        module: "permissions",
        action: "edit",
        userId: currentUser._id,
        organizationId: currentUser.organizationId,
      });

      if (!canEdit) {
        throw new Error("Permission denied");
      }
    }

    const rolePermission = await ctx.db
      .query("rolePermissions")
      .withIndex("by_role_permission", (q) =>
        q.eq("roleId", args.roleId).eq("permissionId", args.permissionId)
      )
      .first();

    if (!rolePermission) {
      throw new Error("Permission not assigned to role");
    }

    await ctx.db.delete(rolePermission._id);

    // Create audit log
    await ctx.db.insert("rbacAuditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "permission_revoked",
      entityType: "permission",
      entityId: args.permissionId,
      changes: {
        roleId: args.roleId,
      },
      timestamp: Date.now(),
    });

    return rolePermission._id;
  },
});

/**
 * Create permission override for user
 */
export const createPermissionOverride = mutation({
  args: {
    userId: v.id("users"),
    permissionId: v.id("permissions"),
    type: v.union(v.literal("grant"), v.literal("deny")),
    conditions: v.optional(
      v.object({
        fields: v.optional(v.array(v.string())),
        custom: v.optional(v.string()),
      })
    ),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only super admin can create permission overrides
    if (!currentUser.isSuperAdmin) {
      throw new Error("Permission denied - only super admin can create permission overrides");
    }

    // Check if override already exists
    const existing = await ctx.db
      .query("permissionOverrides")
      .withIndex("by_user_permission", (q) =>
        q.eq("userId", args.userId).eq("permissionId", args.permissionId)
      )
      .first();

    if (existing) {
      throw new Error("Permission override already exists");
    }

    const overrideId = await ctx.db.insert("permissionOverrides", {
      userId: args.userId,
      permissionId: args.permissionId,
      type: args.type,
      conditions: args.conditions,
      createdAt: Date.now(),
      createdBy: currentUser._id,
      expiresAt: args.expiresAt,
    });

    // Create audit log
    await ctx.db.insert("rbacAuditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "permission_override_created",
      entityType: "permission_override",
      entityId: overrideId,
      changes: {
        userId: args.userId,
        permissionId: args.permissionId,
        type: args.type,
      },
      timestamp: Date.now(),
    });

    return overrideId;
  },
});

/**
 * Delete permission override
 */
export const deletePermissionOverride = mutation({
  args: {
    overrideId: v.id("permissionOverrides"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only super admin can delete permission overrides
    if (!currentUser.isSuperAdmin) {
      throw new Error("Permission denied");
    }

    const override = await ctx.db.get(args.overrideId);
    if (!override) {
      throw new Error("Permission override not found");
    }

    await ctx.db.delete(args.overrideId);

    // Create audit log
    await ctx.db.insert("rbacAuditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "permission_override_deleted",
      entityType: "permission_override",
      entityId: args.overrideId,
      timestamp: Date.now(),
    });

    return args.overrideId;
  },
});

