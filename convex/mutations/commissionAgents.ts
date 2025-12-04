import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { logCreate, logUpdate, logDelete } from "../lib/auditLog";

/**
 * Create a new commission agent (name and mobile mandatory)
 */
export const createCommissionAgent = mutation({
  args: {
    name: v.string(),
    mobile: v.string(), // Mandatory
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user
    let currentUser = null;
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        currentUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
      }
    } catch {}

    if (!currentUser && args.userEmail) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.userEmail!))
        .first();
    }

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Validate required fields
    if (!args.name || !args.mobile) {
      throw new Error("Name and mobile are required");
    }

    // Check if agent with same mobile exists
    const existing = await ctx.db
      .query("commissionAgents")
      .withIndex("by_organization_mobile", (q) =>
        q.eq("organizationId", currentUser.organizationId).eq("mobile", args.mobile)
      )
      .first();

    if (existing) {
      throw new Error("Commission agent with this mobile number already exists");
    }

    const agentId = await ctx.db.insert("commissionAgents", {
      organizationId: currentUser.organizationId,
      name: args.name,
      mobile: args.mobile,
      email: args.email || undefined,
      address: args.address || undefined,
      notes: args.notes || undefined,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser._id,
      updatedBy: currentUser._id,
    });

    await logCreate(
      ctx.db,
      currentUser.organizationId,
      currentUser._id,
      currentUser.name,
      "commissionAgents",
      agentId,
      {
        name: args.name,
        mobile: args.mobile,
        email: args.email,
        address: args.address,
        notes: args.notes,
        isActive: true,
      }
    );

    return agentId;
  },
});

/**
 * Update a commission agent
 */
export const updateCommissionAgent = mutation({
  args: {
    agentId: v.id("commissionAgents"),
    name: v.optional(v.string()),
    mobile: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser = null;
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        currentUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
      }
    } catch {}

    if (!currentUser && args.userEmail) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.userEmail!))
        .first();
    }

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Commission agent not found");
    }

    if (agent.organizationId !== currentUser.organizationId) {
      throw new Error("Not authorized");
    }

    const oldData = {
      name: agent.name,
      mobile: agent.mobile,
      email: agent.email,
      address: agent.address,
      notes: agent.notes,
      isActive: agent.isActive,
    };

    // If mobile is being updated, check for duplicates
    if (args.mobile && args.mobile !== agent.mobile) {
      const existing = await ctx.db
        .query("commissionAgents")
        .withIndex("by_organization_mobile", (q) =>
          q.eq("organizationId", currentUser.organizationId).eq("mobile", args.mobile)
        )
        .first();

      if (existing && existing._id !== args.agentId) {
        throw new Error("Commission agent with this mobile number already exists");
      }
    }

    await ctx.db.patch(args.agentId, {
      name: args.name !== undefined ? args.name : agent.name,
      mobile: args.mobile !== undefined ? args.mobile : agent.mobile,
      email: args.email !== undefined ? args.email : agent.email,
      address: args.address !== undefined ? args.address : agent.address,
      notes: args.notes !== undefined ? args.notes : agent.notes,
      isActive: args.isActive !== undefined ? args.isActive : agent.isActive,
      updatedAt: Date.now(),
      updatedBy: currentUser._id,
    });

    await logUpdate(
      ctx.db,
      currentUser.organizationId,
      currentUser._id,
      currentUser.name,
      "commissionAgents",
      args.agentId,
      oldData,
      {
        name: args.name !== undefined ? args.name : agent.name,
        mobile: args.mobile !== undefined ? args.mobile : agent.mobile,
        email: args.email !== undefined ? args.email : agent.email,
        address: args.address !== undefined ? args.address : agent.address,
        notes: args.notes !== undefined ? args.notes : agent.notes,
        isActive: args.isActive !== undefined ? args.isActive : agent.isActive,
      }
    );

    return args.agentId;
  },
});

/**
 * Delete a commission agent
 */
export const deleteCommissionAgent = mutation({
  args: {
    agentId: v.id("commissionAgents"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser = null;
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        currentUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
      }
    } catch {}

    if (!currentUser && args.userEmail) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.userEmail!))
        .first();
    }

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Commission agent not found");
    }

    if (agent.organizationId !== currentUser.organizationId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.agentId);

    await logDelete(
      ctx.db,
      currentUser.organizationId,
      currentUser._id,
      currentUser.name,
      "commissionAgents",
      args.agentId,
      { name: agent.name, mobile: agent.mobile, email: agent.email, address: agent.address, notes: agent.notes, isActive: agent.isActive }
    );

    return args.agentId;
  },
});

