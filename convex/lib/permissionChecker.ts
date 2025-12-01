import { QueryCtx } from "../_generated/server";

/**
 * Permission Checker Utilities
 * 
 * Provides functions to check user permissions in queries and mutations
 * 
 * Note: In Convex, IDs are strings validated at runtime.
 * TypeScript types are inferred from the schema.
 */

export interface PermissionCheckOptions {
  module: string;
  action: string;
  customAction?: string;
  userId?: string; // Id<"users"> - using string for compatibility
  organizationId?: string; // Id<"organizations"> - using string for compatibility
  resourceId?: string; // For scope-based checks (own, team, department)
}

/**
 * Check if a user has a specific permission
 * This is the core permission checking function
 */
export async function hasPermission(
  ctx: QueryCtx,
  options: PermissionCheckOptions
): Promise<boolean> {
  const { module, action, customAction, userId, organizationId, resourceId } = options;

  if (!userId || !organizationId) {
    return false;
  }

  // Get user
  const user = await ctx.db
    .query("users")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId as any))
    .filter((q) => q.eq(q.field("_id"), userId as any))
    .first();

  if (!user || !user.isActive) {
    return false;
  }

  // Super admin has all permissions
  if (user.isSuperAdmin) {
    return true;
  }

  // Get all active roles for the user
  const userRoles = await ctx.db
    .query("userRoles")
    .withIndex("by_user_active", (q) => q.eq("userId", userId as any).eq("isActive", true))
    .collect();

  // Filter out expired roles
  const activeRoles = userRoles.filter(
    (ur) => !ur.expiresAt || ur.expiresAt > Date.now()
  );

  if (activeRoles.length === 0) {
    return false;
  }

  const roleIds = activeRoles.map((ur) => ur.roleId);

  // Find the permission
  let permission;
  if (action === "custom" && customAction) {
    permission = await ctx.db
      .query("permissions")
      .withIndex("by_module", (q) => q.eq("module", module))
      .filter((q) =>
        q.and(
          q.eq(q.field("action"), "custom" as const),
          q.eq(q.field("customAction"), customAction)
        )
      )
      .first();
  } else {
    permission = await ctx.db
      .query("permissions")
      .withIndex("by_module_action", (q) =>
        q.eq("module", module).eq("action", action as any)
      )
      .first();
  }

  if (!permission) {
    return false;
  }

  // Check for permission overrides first (user-specific)
  const override = await ctx.db
    .query("permissionOverrides")
    .withIndex("by_user_permission", (q) =>
      q.eq("userId", userId as any).eq("permissionId", permission._id)
    )
    .first();

  if (override) {
    // Check if override is expired
    if (override.expiresAt && override.expiresAt < Date.now()) {
      // Override expired, continue with role check
    } else {
      // Override is active
      return override.type === "grant";
    }
  }

  // Check if any role has this permission
  const rolePermissions = await ctx.db
    .query("rolePermissions")
    .withIndex("by_permission", (q) => q.eq("permissionId", permission._id))
    .collect();

  const hasPermissionViaRole = rolePermissions.some((rp) =>
    roleIds.includes(rp.roleId)
  );

  if (!hasPermissionViaRole) {
    return false;
  }

  // If resourceId is provided, check scope-based permissions
  if (resourceId && permission.scope !== "global") {
    return await checkScopePermission(
      ctx,
      userId,
      permission.scope,
      resourceId,
      module
    );
  }

  return true;
}

/**
 * Check scope-based permissions (own, team, department)
 */
async function checkScopePermission(
  ctx: QueryCtx,
  userId: string,
  scope: string,
  resourceId: string,
  module: string
): Promise<boolean> {
  // This is a simplified implementation
  // You can extend this based on your specific needs

  switch (scope) {
    case "own":
      // Check if the resource belongs to the user
      // This depends on your resource structure
      // Example: Check if invoice.createdBy === userId
      return true; // Placeholder - implement based on your schema

    case "team":
      // Check if the resource belongs to the user's team
      // This requires team membership tracking
      return true; // Placeholder

    case "department":
      // Check if the resource belongs to the user's department
      // This requires department tracking
      return true; // Placeholder

    default:
      return true;
  }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  ctx: QueryCtx,
  permissions: Array<Omit<PermissionCheckOptions, "userId" | "organizationId">>,
  userId: string,
  organizationId: string
): Promise<boolean> {
  for (const perm of permissions) {
    if (
      await hasPermission(ctx, {
        ...perm,
        userId,
        organizationId,
      })
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  ctx: QueryCtx,
  permissions: Array<Omit<PermissionCheckOptions, "userId" | "organizationId">>,
  userId: string,
  organizationId: string
): Promise<boolean> {
  for (const perm of permissions) {
    if (
      !(await hasPermission(ctx, {
        ...perm,
        userId,
        organizationId,
      }))
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Get all permissions for a user (for frontend use)
 */
export async function getUserPermissions(
  ctx: QueryCtx,
  userId: string,
  organizationId: string
): Promise<string[]> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId as any))
    .filter((q) => q.eq(q.field("_id"), userId as any))
    .first();

  if (!user || !user.isActive) {
    return [];
  }

  // Super admin has all permissions
  if (user.isSuperAdmin) {
    const allPermissions = await ctx.db.query("permissions").collect();
    return allPermissions.map((p) => {
      if (p.action === "custom" && p.customAction) {
        return `${p.module}:${p.action}:${p.customAction}`;
      }
      return `${p.module}:${p.action}`;
    });
  }

  // Get user roles
  const userRoles = await ctx.db
    .query("userRoles")
    .withIndex("by_user_active", (q) => q.eq("userId", userId as any).eq("isActive", true))
    .collect();

  const activeRoles = userRoles.filter(
    (ur) => !ur.expiresAt || ur.expiresAt > Date.now()
  );

  if (activeRoles.length === 0) {
    return [];
  }

  const roleIds = activeRoles.map((ur) => ur.roleId);

  // Get all permissions for these roles
  const rolePermissions = await ctx.db
    .query("rolePermissions")
    .collect();

  const userRolePermissions = rolePermissions.filter((rp) =>
    roleIds.includes(rp.roleId)
  );

  const permissionIds = new Set(
    userRolePermissions.map((rp) => rp.permissionId)
  );

  // Get permission details
  const permissions = await Promise.all(
    Array.from(permissionIds).map((pid) =>
      ctx.db.get(pid)
    )
  );

  const permissionStrings = permissions
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map((p) => {
      if (p.action === "custom" && p.customAction) {
        return `${p.module}:${p.action}:${p.customAction}`;
      }
      return `${p.module}:${p.action}`;
    });

  // Check for permission overrides (grants)
  const overrides = await ctx.db
    .query("permissionOverrides")
    .withIndex("by_user", (q) => q.eq("userId", userId as any))
    .collect();

  const activeOverrides = overrides.filter(
    (o) => !o.expiresAt || o.expiresAt > Date.now()
  );

  for (const override of activeOverrides) {
    if (override.type === "grant") {
      const perm = await ctx.db.get(override.permissionId);
      if (perm) {
        const permString =
          perm.action === "custom" && perm.customAction
            ? `${perm.module}:${perm.action}:${perm.customAction}`
            : `${perm.module}:${perm.action}`;
        permissionStrings.push(permString);
      }
    } else if (override.type === "deny") {
      const perm = await ctx.db.get(override.permissionId);
      if (perm) {
        const permString =
          perm.action === "custom" && perm.customAction
            ? `${perm.module}:${perm.action}:${perm.customAction}`
            : `${perm.module}:${perm.action}`;
        const index = permissionStrings.indexOf(permString);
        if (index > -1) {
          permissionStrings.splice(index, 1);
        }
      }
    }
  }

  return Array.from(new Set(permissionStrings));
}

