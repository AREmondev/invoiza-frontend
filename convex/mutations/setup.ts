import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { PERMISSION_DEFINITIONS } from "../lib/permissions";

/**
 * Create the first organization and super admin user
 * This is for initial setup - no permission checks required
 */
export const createMainOrganizationAndUser = mutation({
  args: {
    organizationName: v.string(),
    organizationSlug: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    authProvider: v.union(v.literal("email"), v.literal("google"), v.literal("github")),
    authProviderId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if any organization already exists
    const existingOrg = await ctx.db.query("organizations").first();
    if (existingOrg) {
      throw new Error("Organization already exists. Use createUser mutation instead.");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create organization
    const organizationId = await ctx.db.insert("organizations", {
      name: args.organizationName,
      slug: args.organizationSlug,
      plan: "enterprise",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create super admin user
    const userId = await ctx.db.insert("users", {
      email: args.userEmail,
      name: args.userName,
      organizationId,
      emailVerified: false,
      authProvider: args.authProvider,
      authProviderId: args.authProviderId,
      isActive: true,
      isSuperAdmin: true, // Main user is super admin
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Seed permissions
    await seedPermissionsHelper(ctx);

    // Create default admin role
    const adminRoleId = await ctx.db.insert("roles", {
      organizationId,
      name: "admin",
      displayName: "Administrator",
      description: "Full system access with all permissions",
      type: "system",
      priority: 100,
      isActive: true,
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: userId,
    });

    // Assign all permissions to admin role
    const allPermissions = await ctx.db.query("permissions").collect();
    for (const permission of allPermissions) {
      await ctx.db.insert("rolePermissions", {
        roleId: adminRoleId,
        permissionId: permission._id,
        createdAt: Date.now(),
        createdBy: userId,
      });
    }

    // Assign admin role to main user
    await ctx.db.insert("userRoles", {
      userId,
      roleId: adminRoleId,
      assignedAt: Date.now(),
      assignedBy: userId,
      isActive: true,
    });

    // Create default roles
    await createDefaultRoles(ctx, organizationId, userId);

    return {
      organizationId,
      userId,
      adminRoleId,
    };
  },
});

/**
 * Seed permissions (internal helper)
 */
async function seedPermissionsHelper(ctx: any) {
  // Check if permissions already exist
  const existingPermission = await ctx.db.query("permissions").first();
  if (existingPermission) {
    return; // Already seeded
  }

  // Create all permissions
  for (const perm of PERMISSION_DEFINITIONS) {
    await ctx.db.insert("permissions", {
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
  }
}

/**
 * Create default roles (internal helper)
 */
async function createDefaultRoles(ctx: any, organizationId: any, createdBy: any) {
  const allPermissions = await ctx.db.query("permissions").collect();

  // Manager role
  const managerRoleId = await ctx.db.insert("roles", {
    organizationId,
    name: "manager",
    displayName: "Manager",
    description: "Can manage sales, purchases, and inventory",
    type: "system",
    priority: 50,
    isActive: true,
    isDefault: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy,
  });

  // Assign manager permissions (everything except user/role management)
  const managerPermissions = allPermissions.filter(
    (p) =>
      !["users", "roles", "permissions"].includes(p.module) ||
      p.action === "view"
  );
  for (const permission of managerPermissions) {
    await ctx.db.insert("rolePermissions", {
      roleId: managerRoleId,
      permissionId: permission._id,
      createdAt: Date.now(),
      createdBy,
    });
  }

  // Sales Person role
  const salesRoleId = await ctx.db.insert("roles", {
    organizationId,
    name: "sales_person",
    displayName: "Sales Person",
    description: "Can create and view sales",
    type: "system",
    priority: 30,
    isActive: true,
    isDefault: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy,
  });

  const salesPermissions = allPermissions.filter(
    (p) =>
      ["dashboard", "sales", "products", "customers"].includes(p.module) &&
      ["view", "create"].includes(p.action)
  );
  for (const permission of salesPermissions) {
    await ctx.db.insert("rolePermissions", {
      roleId: salesRoleId,
      permissionId: permission._id,
      createdAt: Date.now(),
      createdBy,
    });
  }

  // Cashier role
  const cashierRoleId = await ctx.db.insert("roles", {
    organizationId,
    name: "cashier",
    displayName: "Cashier",
    description: "Can process sales and handle payments",
    type: "system",
    priority: 20,
    isActive: true,
    isDefault: true, // Default role for new users
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy,
  });

  const cashierPermissions = allPermissions.filter(
    (p) =>
      ["dashboard", "sales", "products", "customers"].includes(p.module) &&
      p.action === "view"
  );
  // Add create sale permission
  const createSalePermission = allPermissions.find(
    (p) => p.module === "sales" && p.action === "create"
  );
  if (createSalePermission) {
    await ctx.db.insert("rolePermissions", {
      roleId: cashierRoleId,
      permissionId: createSalePermission._id,
      createdAt: Date.now(),
      createdBy,
    });
  }
  for (const permission of cashierPermissions) {
    await ctx.db.insert("rolePermissions", {
      roleId: cashierRoleId,
      permissionId: permission._id,
      createdAt: Date.now(),
      createdBy,
    });
  }
}

/**
 * Seed permissions manually (if needed)
 */
export const seedPermissions = mutation({
  args: {},
  handler: async (ctx) => {
    const existingPermission = await ctx.db.query("permissions").first();
    if (existingPermission) {
      return { message: "Permissions already seeded", count: 0 };
    }

    let count = 0;
    for (const perm of PERMISSION_DEFINITIONS) {
      await ctx.db.insert("permissions", {
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
      count++;
    }

    return { message: `Created ${count} permissions`, count };
  },
});

