import { query } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission } from "../lib/permissionChecker";

async function getCurrentUserHelper(ctx: any, email?: string) {
  try {
    // Try Convex Auth first
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
      // Continue with email parameter
    }

    // Fallback: Use email from query args
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
 * Get all users in organization
 */
export const getUsers = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
    userEmail: v.optional(v.string()), // Email from NextAuth session
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserHelper(ctx, args.userEmail);
    if (!currentUser) {
      return [];
    }

    const canView = await hasPermission(ctx, {
      module: "users",
      action: "view",
      userId: currentUser._id,
      organizationId: currentUser.organizationId,
    });

    if (!canView && !currentUser.isSuperAdmin) {
      return [];
    }

    const organizationId = args.organizationId || currentUser.organizationId;

    const users = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    // Get roles for each user
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const userRoles = await ctx.db
          .query("userRoles")
          .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
          .collect();

        const roles = await Promise.all(
          userRoles.map((ur) => ctx.db.get(ur.roleId))
        );

        return {
          ...user,
          roles: roles.filter((r): r is NonNullable<typeof r> => r !== null),
        };
      })
    );

    return usersWithRoles;
  },
});

