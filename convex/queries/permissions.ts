import { query } from "../_generated/server";
import { hasPermission, getUserPermissions } from "../lib/permissionChecker";
import { v } from "convex/values";

/**
 * Get current user identity helper
 * Note: You'll need to set up Convex Auth
 * See: https://docs.convex.dev/auth
 */
/**
 * Get current user helper - works with NextAuth session
 * The email is passed from the frontend via the query args
 */
async function getCurrentUserHelper(ctx: any, email?: string) {
  try {
    // Try to get from Convex Auth first (if using Convex Auth)
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
        if (user) return user;
      }
    } catch {
      // Convex Auth not configured, continue with email parameter
    }

    // Fallback: Use email from query args (from NextAuth session)
    if (email) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      return user;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if current user has a specific permission
 */
export const checkPermission = query({
  args: {
    module: v.string(),
    action: v.string(),
    customAction: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    userEmail: v.optional(v.string()), // Email from NextAuth session
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserHelper(ctx, args.userEmail);
    if (!user) {
      return false;
    }

    return hasPermission(ctx, {
      module: args.module,
      action: args.action,
      customAction: args.customAction,
      userId: user._id,
      organizationId: user.organizationId,
      resourceId: args.resourceId,
    });
  },
});

/**
 * Get all permissions for current user
 */
export const getCurrentUserPermissions = query({
  args: {
    userEmail: v.optional(v.string()), // Email from NextAuth session
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserHelper(ctx, args.userEmail);
    if (!user) {
      return [];
    }

    return getUserPermissions(ctx, user._id, user.organizationId);
  },
});

/**
 * Get user details with permissions
 */
export const getCurrentUser = query({
  args: {
    userEmail: v.optional(v.string()), // Email from NextAuth session
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserHelper(ctx, args.userEmail);
    if (!user) {
      return null;
    }

    const permissions = await getUserPermissions(ctx, user._id, user.organizationId);
    const organization = await ctx.db.get(user.organizationId);

    // Get user roles
    const userRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
      .collect();

    const roles = await Promise.all(
      userRoles.map((ur) => ctx.db.get(ur.roleId))
    );

    return {
      ...user,
      permissions,
      organization,
      roles: roles.filter((r): r is NonNullable<typeof r> => r !== null),
    };
  },
});

/**
 * Get all permissions (for admin UI)
 */
export const getAllPermissions = query({
  args: {
    userEmail: v.optional(v.string()), // Email from NextAuth session
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserHelper(ctx, args.userEmail);
    if (!user) {
      return [];
    }

    const canView = await hasPermission(ctx, {
      module: "permissions",
      action: "view",
      userId: user._id,
      organizationId: user.organizationId,
    });

    if (!canView && !user.isSuperAdmin) {
      return [];
    }

    return ctx.db.query("permissions").collect();
  },
});

/**
 * Get permissions by module
 */
export const getPermissionsByModule = query({
  args: {
    module: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("permissions")
      .withIndex("by_module", (q) => q.eq("module", args.module))
      .collect();
  },
});

