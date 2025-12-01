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
 * Get all roles in organization
 */
export const getRoles = query({
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
      module: "roles",
      action: "view",
      userId: currentUser._id,
      organizationId: currentUser.organizationId,
    });

    if (!canView && !currentUser.isSuperAdmin) {
      return [];
    }

    const organizationId = args.organizationId || currentUser.organizationId;

    const roles = await ctx.db
      .query("roles")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const rolePermissions = await ctx.db
          .query("rolePermissions")
          .withIndex("by_role", (q) => q.eq("roleId", role._id))
          .collect();

        const permissions = await Promise.all(
          rolePermissions.map((rp) => ctx.db.get(rp.permissionId))
        );

        return {
          ...role,
          permissions: permissions.filter(
            (p): p is NonNullable<typeof p> => p !== null
          ),
        };
      })
    );

    return rolesWithPermissions;
  },
});

