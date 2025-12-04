import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { logCreate, logUpdate, logDelete } from "../lib/auditLog";

/**
 * Create a new customer (name is mandatory, all other fields optional)
 */
export const createCustomer = mutation({
  args: {
    name: v.string(), // Mandatory
    type: v.optional(v.union(v.literal("business"), v.literal("individual"))),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    mobile: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"))),
    billingAliases: v.optional(v.array(v.string())),
    addresses: v.optional(
      v.array(
        v.object({
          type: v.string(),
          street: v.optional(v.string()),
          city: v.optional(v.string()),
          state: v.optional(v.string()),
          zipCode: v.optional(v.string()),
          country: v.optional(v.string()),
          isDefault: v.optional(v.boolean()),
        })
      )
    ),
    metadata: v.optional(v.any()),
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

    // Validate mandatory field
    if (!args.name || !args.name.trim()) {
      throw new Error("Customer name is required");
    }

    const customerId = await ctx.db.insert("customers", {
      organizationId: currentUser.organizationId,
      name: args.name.trim(),
      type: args.type,
      email: args.email,
      phone: args.phone,
      mobile: args.mobile,
      status: args.status || "active",
      billingAliases: args.billingAliases,
      addresses: args.addresses,
      metadata: args.metadata,
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
      "customers",
      customerId,
      {
        name: args.name,
        type: args.type,
        email: args.email,
        phone: args.phone,
        mobile: args.mobile,
        status: args.status || "active",
      }
    );

    return customerId;
  },
});

/**
 * Update a customer
 */
export const updateCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("business"), v.literal("individual"))),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    mobile: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"))),
    billingAliases: v.optional(v.array(v.string())),
    addresses: v.optional(
      v.array(
        v.object({
          type: v.string(),
          street: v.optional(v.string()),
          city: v.optional(v.string()),
          state: v.optional(v.string()),
          zipCode: v.optional(v.string()),
          country: v.optional(v.string()),
          isDefault: v.optional(v.boolean()),
        })
      )
    ),
    metadata: v.optional(v.any()),
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

    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    if (customer.organizationId !== currentUser.organizationId) {
      throw new Error("Not authorized");
    }

    const oldData = {
      name: customer.name,
      type: customer.type,
      email: customer.email,
      phone: customer.phone,
      mobile: customer.mobile,
      status: customer.status,
      isActive: customer.isActive,
    };

    await ctx.db.patch(args.customerId, {
      name: args.name !== undefined ? args.name.trim() : customer.name,
      type: args.type !== undefined ? args.type : customer.type,
      email: args.email !== undefined ? args.email : customer.email,
      phone: args.phone !== undefined ? args.phone : customer.phone,
      mobile: args.mobile !== undefined ? args.mobile : customer.mobile,
      status: args.status !== undefined ? args.status : customer.status,
      billingAliases: args.billingAliases !== undefined ? args.billingAliases : customer.billingAliases,
      addresses: args.addresses !== undefined ? args.addresses : customer.addresses,
      metadata: args.metadata !== undefined ? args.metadata : customer.metadata,
      isActive: args.isActive !== undefined ? args.isActive : customer.isActive,
      updatedAt: Date.now(),
      updatedBy: currentUser._id,
    });

    await logUpdate(
      ctx.db,
      currentUser.organizationId,
      currentUser._id,
      currentUser.name,
      "customers",
      args.customerId,
      oldData,
      {
        name: args.name !== undefined ? args.name.trim() : customer.name,
        type: args.type !== undefined ? args.type : customer.type,
        email: args.email !== undefined ? args.email : customer.email,
        phone: args.phone !== undefined ? args.phone : customer.phone,
        mobile: args.mobile !== undefined ? args.mobile : customer.mobile,
        status: args.status !== undefined ? args.status : customer.status,
        isActive: args.isActive !== undefined ? args.isActive : customer.isActive,
      }
    );

    return args.customerId;
  },
});

/**
 * Delete a customer (soft delete by setting isActive to false)
 */
export const deleteCustomer = mutation({
  args: {
    customerId: v.id("customers"),
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

    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    if (customer.organizationId !== currentUser.organizationId) {
      throw new Error("Not authorized");
    }

    // Soft delete
    await ctx.db.patch(args.customerId, {
      isActive: false,
      updatedAt: Date.now(),
      updatedBy: currentUser._id,
    });

    await logDelete(
      ctx.db,
      currentUser.organizationId,
      currentUser._id,
      currentUser.name,
      "customers",
      args.customerId,
      { name: customer.name, email: customer.email, phone: customer.phone }
    );

    return args.customerId;
  },
});

