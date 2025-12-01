"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

/**
 * Hash a password (action because bcrypt uses setTimeout)
 */
export const hashPassword = action({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const hash = await bcrypt.hash(args.password, 10);
    return { hash };
  },
});

/**
 * Compare password with hash (action because bcrypt uses setTimeout)
 */
export const comparePassword = action({
  args: {
    password: v.string(),
    hash: v.string(),
  },
  handler: async (ctx, args) => {
    const isValid = await bcrypt.compare(args.password, args.hash);
    return { isValid };
  },
});

