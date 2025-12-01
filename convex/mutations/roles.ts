import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission } from "../lib/permissionChecker";

/**
 * Create a new role
 */
export const createRole = mutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    priority: v.number(),
    isDefault: v.optional(v.boolean()),
    permissionIds: v.optional(v.array(v.id("permissions"))),
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
        module: "roles",
        action: "create",
        userId: currentUser._id,
        organizationId: currentUser.organizationId,
      });

      if (!canCreate) {
        throw new Error("Permission denied");
      }
    }

    // Check if role name already exists in organization
    const existingRole = await ctx.db
      .query("roles")
      .withIndex("by_organization_name", (q) =>
        q.eq("organizationId", currentUser.organizationId).eq("name", args.name)
      )
      .first();

    if (existingRole) {
      throw new Error("Role with this name already exists");
    }

    // Create role
    const roleId = await ctx.db.insert("roles", {
      organizationId: currentUser.organizationId,
      name: args.name,
      displayName: args.displayName,
      description: args.description,
      type: "custom",
      priority: args.priority,
      isActive: true,
      isDefault: args.isDefault ?? false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser._id,
    });

    // Assign permissions
    if (args.permissionIds && args.permissionIds.length > 0) {
      for (const permissionId of args.permissionIds) {
        await ctx.db.insert("rolePermissions", {
          roleId,
          permissionId,
          createdAt: Date.now(),
          createdBy: currentUser._id,
        });
      }
    }

    // Create audit log
    await ctx.db.insert("rbacAuditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "role_created",
      entityType: "role",
      entityId: roleId,
      changes: {
        name: args.name,
        displayName: args.displayName,
        permissions: args.permissionIds,
      },
      timestamp: Date.now(),
    });

    return roleId;
  },
});

/**
 * Update role
 */
export const updateRole = mutation({
  args: {
    roleId: v.id("roles"),
    displayName: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
    permissionIds: v.optional(v.array(v.id("permissions"))),
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

    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    // Super admin bypasses all permission checks
    if (!currentUser.isSuperAdmin) {
      const canEdit = await hasPermission(ctx, {
        module: "roles",
        action: "edit",
        userId: currentUser._id,
        organizationId: currentUser.organizationId,
      });

      if (!canEdit) {
        throw new Error("Permission denied");
      }

      // Cannot modify system roles (only super admin can)
      if (role.type === "system") {
        throw new Error("Cannot modify system roles");
      }
    }

    const changes: Record<string, any> = {};

    // Update role
    if (args.displayName !== undefined) {
      changes.displayName = args.displayName;
      await ctx.db.patch(args.roleId, { displayName: args.displayName });
    }

    if (args.description !== undefined) {
      changes.description = args.description;
      await ctx.db.patch(args.roleId, { description: args.description });
    }

    if (args.priority !== undefined) {
      changes.priority = args.priority;
      await ctx.db.patch(args.roleId, { priority: args.priority });
    }

    if (args.isActive !== undefined) {
      changes.isActive = args.isActive;
      await ctx.db.patch(args.roleId, { isActive: args.isActive });
    }

    if (args.isDefault !== undefined) {
      changes.isDefault = args.isDefault;
      await ctx.db.patch(args.roleId, { isDefault: args.isDefault });
    }

    await ctx.db.patch(args.roleId, { updatedAt: Date.now() });

    // Update permissions
    if (args.permissionIds !== undefined) {
      // Remove existing permissions
      const existingPermissions = await ctx.db
        .query("rolePermissions")
        .withIndex("by_role", (q) => q.eq("roleId", args.roleId))
        .collect();

      for (const rp of existingPermissions) {
        await ctx.db.delete(rp._id);
      }

      // Add new permissions
      for (const permissionId of args.permissionIds) {
        await ctx.db.insert("rolePermissions", {
          roleId: args.roleId,
          permissionId,
          createdAt: Date.now(),
          createdBy: currentUser._id,
        });
      }

      changes.permissions = args.permissionIds;
    }

    // Create audit log
    await ctx.db.insert("rbacAuditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "role_updated",
      entityType: "role",
      entityId: args.roleId,
      changes,
      timestamp: Date.now(),
    });

    return args.roleId;
  },
});

/**
 * Delete role
 */
export const deleteRole = mutation({
  args: {
    roleId: v.id("roles"),
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

    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    // Check permission
    // Super admin bypasses all permission checks
    if (!currentUser.isSuperAdmin) {
      const canDelete = await hasPermission(ctx, {
        module: "roles",
        action: "delete",
        userId: currentUser._id,
        organizationId: currentUser.organizationId,
      });

      if (!canDelete) {
        throw new Error("Permission denied");
      }
    }

    // Cannot delete system roles
    if (role.type === "system") {
      throw new Error("Cannot delete system roles");
    }

    // Check if role is assigned to any users
    const userRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_role", (q) => q.eq("roleId", args.roleId))
      .collect();

    if (userRoles.length > 0) {
      throw new Error("Cannot delete role that is assigned to users");
    }

    // Delete role permissions
    const rolePermissions = await ctx.db
      .query("rolePermissions")
      .withIndex("by_role", (q) => q.eq("roleId", args.roleId))
      .collect();

    for (const rp of rolePermissions) {
      await ctx.db.delete(rp._id);
    }

    // Delete role
    await ctx.db.delete(args.roleId);

    // Create audit log
    await ctx.db.insert("rbacAuditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "role_deleted",
      entityType: "role",
      entityId: args.roleId,
      timestamp: Date.now(),
    });

    return args.roleId;
  },
});


