import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * RBAC Schema for Multi-Tenant SaaS Application
 * 
 * This schema defines:
 * - Organizations (multi-tenant support)
 * - Users (with organization membership)
 * - Roles (organization-scoped)
 * - Permissions (global definitions)
 * - Role-Permission mappings
 * - User-Role assignments
 */

export default defineSchema({
  // Organizations/Tenants for multi-tenant support
  organizations: defineTable({
    name: v.string(),
    slug: v.string(), // URL-friendly identifier
    domain: v.optional(v.string()), // Custom domain
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    settings: v.optional(
      v.object({
        maxUsers: v.optional(v.number()),
        maxStorage: v.optional(v.number()),
        features: v.optional(v.array(v.string())),
      })
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_slug", ["slug"])
    .index("by_domain", ["domain"]),

  // Users table
  users: defineTable({
    email: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
    emailVerified: v.boolean(),
    
    // Organization membership
    organizationId: v.id("organizations"),
    
    // Authentication
    authProvider: v.union(v.literal("email"), v.literal("google"), v.literal("github")),
    authProviderId: v.string(), // External auth provider ID
    passwordHash: v.optional(v.string()), // Hashed password for email auth
    
    // User status
    isActive: v.boolean(),
    isSuperAdmin: v.boolean(), // System-wide super admin
    
    // Metadata
    lastLoginAt: v.optional(v.number()),
    preferences: v.optional(
      v.object({
        theme: v.optional(v.string()),
        language: v.optional(v.string()),
        timezone: v.optional(v.string()),
        dateFormat: v.optional(v.string()),
      })
    ),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_organization", ["organizationId"])
    .index("by_auth_provider", ["authProvider", "authProviderId"]),

  // Roles table (organization-scoped)
  roles: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    
    // Role type
    type: v.union(
      v.literal("system"), // System-defined roles (cannot be deleted)
      v.literal("custom")  // Custom roles created by users
    ),
    
    // Role hierarchy (higher number = more permissions)
    priority: v.number(), // Used for permission inheritance
    
    isActive: v.boolean(),
    isDefault: v.boolean(), // Default role for new users
    
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_name", ["organizationId", "name"]),

  // Permissions table (global definitions)
  permissions: defineTable({
    // Module identifier (e.g., "products", "sales", "customers")
    module: v.string(),
    
    // Action type
    action: v.union(
      v.literal("view"),
      v.literal("create"),
      v.literal("edit"),
      v.literal("delete"),
      v.literal("export"),
      v.literal("approve"),
      v.literal("custom")
    ),
    
    // Custom action name (if action is "custom")
    customAction: v.optional(v.string()),
    
    // Permission metadata
    displayName: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()), // Group related permissions
    
    // Permission scope
    scope: v.union(
      v.literal("global"),    // Organization-wide
      v.literal("own"),      // Own records only
      v.literal("team"),     // Team records
      v.literal("department") // Department records
    ),
    
    // System vs custom permission
    isSystem: v.boolean(), // System-defined permissions cannot be deleted
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_module", ["module"])
    .index("by_module_action", ["module", "action"])
    .index("by_category", ["category"]),

  // Role-Permission mappings
  rolePermissions: defineTable({
    roleId: v.id("roles"),
    permissionId: v.id("permissions"),
    
    // Permission conditions
    conditions: v.optional(
      v.object({
        // Field-level conditions
        fields: v.optional(v.array(v.string())), // Allowed fields
        // Custom conditions as JSON
        custom: v.optional(v.string()),
      })
    ),
    
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_role", ["roleId"])
    .index("by_permission", ["permissionId"])
    .index("by_role_permission", ["roleId", "permissionId"]),

  // User-Role assignments
  userRoles: defineTable({
    userId: v.id("users"),
    roleId: v.id("roles"),
    
    // Assignment metadata
    assignedAt: v.number(),
    assignedBy: v.id("users"),
    expiresAt: v.optional(v.number()), // Temporary role assignment
    
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["roleId"])
    .index("by_user_role", ["userId", "roleId"])
    .index("by_user_active", ["userId", "isActive"]),

  // Permission overrides (user-specific permission overrides)
  permissionOverrides: defineTable({
    userId: v.id("users"),
    permissionId: v.id("permissions"),
    
    // Override type
    type: v.union(
      v.literal("grant"),  // Grant permission even if role doesn't have it
      v.literal("deny")    // Deny permission even if role has it
    ),
    
    // Override conditions
    conditions: v.optional(
      v.object({
        fields: v.optional(v.array(v.string())),
        custom: v.optional(v.string()),
      })
    ),
    
    createdAt: v.number(),
    createdBy: v.id("users"),
    expiresAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_permission", ["userId", "permissionId"]),

  // Audit logs for RBAC changes
  rbacAuditLogs: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"), // User who performed the action
    action: v.union(
      v.literal("user_created"),
      v.literal("user_updated"),
      v.literal("user_deleted"),
      v.literal("role_created"),
      v.literal("role_updated"),
      v.literal("role_deleted"),
      v.literal("permission_granted"),
      v.literal("permission_revoked"),
      v.literal("role_assigned"),
      v.literal("role_unassigned"),
      v.literal("permission_override_created"),
      v.literal("permission_override_deleted")
    ),
    entityType: v.string(), // "user", "role", "permission", etc.
    entityId: v.string(),
    changes: v.optional(v.any()), // JSON object of changes (flexible structure)
    metadata: v.optional(v.object({})),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"]),

  // Brands table (pharmacy-specific)
  brands: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    code: v.optional(v.string()), // Brand code/short name
    description: v.optional(v.string()),
    manufacturer: v.optional(v.string()), // For pharmacy: manufacturer name
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_name", ["organizationId", "name"]),

  // Categories table (pharmacy-specific)
  categories: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    code: v.optional(v.string()), // Category code
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")), // For nested categories
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_name", ["organizationId", "name"])
    .index("by_parent", ["parentId"]),

  // Godowns/Storage Rooms (already exists in types, adding to schema)
  godowns: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    code: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_name", ["organizationId", "name"]),

  // Units table (independent unit management for pharmacy)
  units: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(), // e.g., "Box", "Piece", "Strip", "Bottle"
    abbreviation: v.string(), // e.g., "box", "pc", "strip", "bottle"
    description: v.optional(v.string()),
    isBaseUnit: v.boolean(), // Whether this is a base unit (like "Piece")
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_name", ["organizationId", "name"]),

  // Unit Conversions table (stores conversions like 1 box = 25 pcs)
  unitConversions: defineTable({
    organizationId: v.id("organizations"),
    baseUnitId: v.id("units"), // Base unit (e.g., Box)
    secondaryUnitId: v.id("units"), // Secondary unit (e.g., Piece)
    conversionFactor: v.number(), // How many secondary units = 1 base unit (e.g., 25)
    description: v.optional(v.string()), // e.g., "1 Box = 25 Pieces"
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_base_unit", ["baseUnitId"])
    .index("by_secondary_unit", ["secondaryUnitId"])
    .index("by_units", ["baseUnitId", "secondaryUnitId"]),

  // Products table (updated to reference brands, categories, and use unit conversions)
  products: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(), // Item Name (required)
    description: v.optional(v.string()),
    sku: v.string(),
    barcode: v.optional(v.string()),
    
    // References to brands and categories
    brandId: v.optional(v.id("brands")),
    categoryId: v.optional(v.id("categories")),
    
    // Base unit reference
    baseUnitId: v.id("units"),
    
    // Pricing (in smallest unit - cents)
    salePrice: v.number(), // Sale price per smallest unit
    purchasePrice: v.number(), // Purchase price per smallest unit
    
    // Stock tracking
    stockQuantity: v.number(), // Total stock in base/smallest unit
    stockValue: v.number(), // Total stock value
    minStockLevel: v.number(),
    maxStockLevel: v.number(),
    
    // Unit-specific pricing (for different units like box, strip, etc.)
    unitPricing: v.optional(
      v.array(
        v.object({
          unitId: v.id("units"),
          salePrice: v.number(), // Price for this unit
          purchasePrice: v.number(), // Cost for this unit
        })
      )
    ),
    
    // Unit conversions used for this product
    unitConversionIds: v.optional(v.array(v.id("unitConversions"))),
    
    // Godown/Storage tracking
    godownStocks: v.optional(
      v.array(
        v.object({
          godownId: v.id("godowns"),
          quantity: v.number(), // Quantity in base unit
        })
      )
    ),
    
    // Variations
    variations: v.optional(
      v.array(
        v.object({
          name: v.string(),
          sku: v.string(),
          attributes: v.any(), // Flexible attributes
          barcode: v.optional(v.string()),
          isActive: v.boolean(),
        })
      )
    ),
    
    // Images
    images: v.optional(v.array(v.string())),
    
    // Metadata
    metadata: v.optional(v.any()),
    
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_sku", ["sku"])
    .index("by_brand", ["brandId"])
    .index("by_category", ["categoryId"])
    .index("by_base_unit", ["baseUnitId"]),
});

