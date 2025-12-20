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

  // Comprehensive audit logs for all entity changes
  auditLogs: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"), // User who performed the action
    userName: v.string(), // User name for quick access
    action: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("approve"),
      v.literal("cancel"),
      v.literal("lock"),
      v.literal("unlock"),
      v.literal("return"),
      v.literal("payment")
    ),
    entityType: v.string(), // "product", "brand", "category", "unit", "customer", "sale", "purchase", "invoice", etc.
    entityId: v.string(), // ID of the entity (can be Convex ID or string)
    changes: v.array(
      v.object({
        field: v.string(),
        oldValue: v.optional(v.any()), // Optional - null for creates, undefined for updates without old value
        newValue: v.optional(v.any()), // Optional - null for deletes, undefined for updates without new value
        dataType: v.string(), // "string", "number", "boolean", "object", "array", etc.
      })
    ),
    metadata: v.optional(v.any()), // Additional metadata (IP address, user agent, reason, etc.)
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_organization_timestamp", ["organizationId", "timestamp"]),

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
    fakePrice: v.optional(v.boolean()), // Fake price flag
    
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

  // Additional Charges table (simple - name only)
  additionalCharges: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(), // Charge name (e.g., "Delivery Fee", "Service Charge")
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_name", ["organizationId", "name"]),

  // Commission Agents table (name and mobile mandatory)
  commissionAgents: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(), // Agent name (mandatory)
    mobile: v.string(), // Mobile number (mandatory)
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_mobile", ["organizationId", "mobile"]),

  // Customers table (minimal mandatory fields - only name)
  customers: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(), // Customer name (mandatory)
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
    // Sales tracking fields (optional for backward compatibility)
    totalSalesCents: v.optional(v.number()), // Total sales amount in cents
    totalSalesCount: v.optional(v.number()), // Total number of sales/invoices
    totalDueCents: v.optional(v.number()), // Total due amount in cents
    lastSaleDate: v.optional(v.number()), // Timestamp of last sale
    nextDueDate: v.optional(v.number()), // Timestamp of next due date (earliest unpaid invoice due date)
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_name", ["organizationId", "name"])
    .index("by_organization_email", ["organizationId", "email"])
    .index("by_organization_phone", ["organizationId", "phone"])
    .index("by_organization_due", ["organizationId", "totalDueCents"]),

  // Invoices table (for sales and purchases)
  invoices: defineTable({
    organizationId: v.id("organizations"),
    invoiceNumber: v.string(),
    type: v.union(v.literal("sale"), v.literal("purchase")),
    
    // Customer/Supplier references
    customerId: v.optional(v.id("customers")),
    supplierId: v.optional(v.string()), // Can be string for now if no supplier table
    
    // Billing information
    billingName: v.optional(v.string()),
    billingAddress: v.optional(v.any()),
    
    // Dates
    invoiceDate: v.number(), // Timestamp
    dueDate: v.optional(v.number()), // Timestamp
    
    // Financials (in cents)
    subtotalCents: v.number(),
    discountCents: v.number(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountValue: v.number(),
    additionalChargesCents: v.number(),
    taxCents: v.number(),
    totalCents: v.number(),
    paidCents: v.number(),
    dueCents: v.number(),
    
    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("approved"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled")
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("partial"),
      v.literal("paid"),
      v.literal("overpaid")
    ),
    paymentMethod: v.optional(v.string()),
    
    // Line items (stored as array)
    lineItems: v.array(
      v.object({
        productId: v.id("products"),
        variationId: v.optional(v.string()),
        unit: v.string(),
        quantity: v.number(),
        unitPriceCents: v.number(),
        totalPriceCents: v.number(),
        discountCents: v.number(),
        costCents: v.number(),
        profitCents: v.number(),
        notes: v.optional(v.string()),
      })
    ),
    
    // Additional charges
    additionalCharges: v.optional(
      v.array(
        v.object({
          additionalChargeId: v.id("additionalCharges"),
          lineItemIds: v.optional(v.array(v.string())),
          amountCents: v.number(),
        })
      )
    ),
    
    // Commission agent
    commissionAgentId: v.optional(v.id("commissionAgents")),
    
    // Notes and terms
    notes: v.optional(v.string()),
    terms: v.optional(v.string()),
    
    // Locking
    isLocked: v.boolean(),
    lockedBy: v.optional(v.id("users")),
    lockedAt: v.optional(v.number()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_type", ["organizationId", "type"])
    .index("by_customer", ["customerId"])
    .index("by_invoice_number", ["invoiceNumber"])
    .index("by_status", ["status"])
    .index("by_date", ["invoiceDate"]),

  // Payments table (for tracking payments separately)
  payments: defineTable({
    organizationId: v.id("organizations"),
    invoiceId: v.id("invoices"),
    customerId: v.optional(v.id("customers")),
    amountCents: v.number(),
    paymentMethod: v.string(),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    paymentDate: v.number(), // Timestamp
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    processedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_invoice", ["invoiceId"])
    .index("by_customer", ["customerId"])
    .index("by_date", ["paymentDate"])
    .index("by_status", ["status"]),

  // Payment Methods table (for managing payment methods)
  paymentMethods: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(), // e.g., "Cash", "Credit Card", "Bank Transfer"
    code: v.string(), // Unique code identifier (e.g., "cash", "credit_card")
    type: v.union(
      v.literal("cash"),
      v.literal("bank"),
      v.literal("e_wallet"),
      v.literal("card"),
      v.literal("check"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
    // Bank-specific fields
    bankName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    accountHolderName: v.optional(v.string()),
    branchName: v.optional(v.string()),
    // E-wallet specific fields
    eWalletType: v.optional(v.string()), // e.g., "bKash", "Nagad", "Rocket", "PayPal"
    eWalletNumber: v.optional(v.string()),
    // Card specific fields
    cardType: v.optional(v.string()), // e.g., "Credit", "Debit"
    cardLastFour: v.optional(v.string()),
    // Balance tracking (for bank and cash)
    balanceCents: v.optional(v.number()), // Current balance in cents
    initialBalanceCents: v.optional(v.number()), // Initial balance when created
    isActive: v.boolean(),
    sortOrder: v.number(), // For ordering in UI
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_code", ["organizationId", "code"])
    .index("by_organization_active", ["organizationId", "isActive"])
    .index("by_organization_type", ["organizationId", "type"]),
});

