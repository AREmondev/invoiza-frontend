import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Register a new user with email and password
 */
export const register = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(), // Password already hashed by client using action
    name: v.string(),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Get or create organization
    let organizationId = args.organizationId;
    if (!organizationId) {
      // Create a default organization for the user
      organizationId = await ctx.db.insert("organizations", {
        name: `${args.name}'s Organization`,
        slug: args.email.split("@")[0].toLowerCase(),
        plan: "free",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Create user account
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      organizationId,
      emailVerified: false,
      authProvider: "email",
      authProviderId: args.email, // Will be updated with actual auth ID
      isActive: true,
      isSuperAdmin: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update user with password hash (already hashed by client)
    await ctx.db.patch(userId, {
      passwordHash: args.passwordHash,
      authProviderId: userId, // Use userId as authProviderId for email auth
    });

    // Assign default role (cashier)
    const defaultRole = await ctx.db
      .query("roles")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();

    if (defaultRole) {
      await ctx.db.insert("userRoles", {
        userId,
        roleId: defaultRole._id,
        assignedAt: Date.now(),
        assignedBy: userId,
        isActive: true,
      });
    }

    return { userId, organizationId };
  },
});

/**
 * Update user password
 */
export const updatePassword = mutation({
  args: {
    currentPasswordHash: v.string(), // Client will hash current password
    newPasswordHash: v.string(), // Client will hash new password
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || !user.passwordHash) {
      throw new Error("User not found");
    }

    // Verify current password hash matches
    // Note: In production, use an action to compare passwords
    if (args.currentPasswordHash !== user.passwordHash) {
      throw new Error("Current password is incorrect");
    }

    // Update password with new hash
    await ctx.db.patch(user._id, {
      passwordHash: args.newPasswordHash,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update last login timestamp
 */
export const updateLastLogin = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastLoginAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Request password reset
 */
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      // Don't reveal if user exists for security
      return { success: true };
    }

    // Generate reset token (in production, send email)
    // For now, just return success
    return { success: true };
  },
});

