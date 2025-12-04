import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all audit logs for an organization
 */
export const getAuditLogs = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    action: v.optional(
      v.union(
        v.literal("create"),
        v.literal("update"),
        v.literal("delete"),
        v.literal("approve"),
        v.literal("cancel"),
        v.literal("lock"),
        v.literal("unlock"),
        v.literal("return"),
        v.literal("payment")
      )
    ),
    limit: v.optional(v.number()),
    startTimestamp: v.optional(v.number()),
    endTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current user's organization
    let organizationId = args.organizationId;
    
    if (!organizationId) {
      try {
        const identity = await ctx.auth.getUserIdentity();
        if (identity?.email) {
          const currentUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();
          
          if (currentUser) {
            organizationId = currentUser.organizationId;
          }
        }
      } catch {}
    }

    if (!organizationId) {
      return [];
    }

    // Build query
    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_organization_timestamp", (q) =>
        q.eq("organizationId", organizationId!)
      );

    // Apply filters
    const logs = await query
      .order("desc")
      .collect();

    // Filter in memory (Convex doesn't support complex filters in queries)
    let filtered = logs;

    if (args.entityType) {
      filtered = filtered.filter((log) => log.entityType === args.entityType);
    }

    if (args.entityId) {
      filtered = filtered.filter((log) => log.entityId === args.entityId);
    }

    if (args.userId) {
      filtered = filtered.filter((log) => log.userId === args.userId);
    }

    if (args.action) {
      filtered = filtered.filter((log) => log.action === args.action);
    }

    if (args.startTimestamp) {
      filtered = filtered.filter((log) => log.timestamp >= args.startTimestamp!);
    }

    if (args.endTimestamp) {
      filtered = filtered.filter((log) => log.timestamp <= args.endTimestamp!);
    }

    // Apply limit
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

/**
 * Get audit logs for a specific entity
 */
export const getEntityAuditLogs = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current user's organization
    let organizationId: string | undefined;
    
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        const currentUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
        
        if (currentUser) {
          organizationId = currentUser.organizationId;
        }
      }
    } catch {}

    if (!organizationId) {
      return [];
    }

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .filter((q) => q.eq(q.field("organizationId"), organizationId))
      .order("desc")
      .collect();

    if (args.limit) {
      return logs.slice(0, args.limit);
    }

    return logs;
  },
});

/**
 * Get audit logs for a specific user
 */
export const getUserAuditLogs = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    if (args.limit) {
      return logs.slice(0, args.limit);
    }

    return logs;
  },
});

/**
 * Get recent audit logs (for dashboard/activity feed)
 */
export const getRecentAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current user's organization
    let organizationId: string | undefined;
    
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        const currentUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
        
        if (currentUser) {
          organizationId = currentUser.organizationId;
        }
      }
    } catch {}

    if (!organizationId) {
      return [];
    }

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_organization_timestamp", (q) =>
        q.eq("organizationId", organizationId!)
      )
      .order("desc")
      .take(args.limit || 50);

    return logs;
  },
});

