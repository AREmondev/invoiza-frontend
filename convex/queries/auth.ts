import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get user by email (for NextAuth)
 */
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      image: user.image,
      passwordHash: user.passwordHash,
      isActive: user.isActive,
      organizationId: user.organizationId,
      isSuperAdmin: user.isSuperAdmin,
    };
  },
});

/**
 * Get current authenticated user
 */
export const getAuthUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || !user.isActive) {
      return null;
    }

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      image: user.image,
      organizationId: user.organizationId,
      isSuperAdmin: user.isSuperAdmin,
      emailVerified: user.emailVerified,
    };
  },
});

