import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a new product
 */
export const createProduct = mutation({
  args: {
    name: v.string(),
    sku: v.string(),
    description: v.optional(v.string()),
    barcode: v.optional(v.string()),
    brandId: v.optional(v.id("brands")),
    categoryId: v.optional(v.id("categories")),
    baseUnitId: v.id("units"),
    salePrice: v.number(), // Base unit sale price in cents
    purchasePrice: v.number(), // Base unit purchase price in cents
    stockQuantity: v.number(), // Stock in base unit
    minStockLevel: v.number(),
    maxStockLevel: v.optional(v.number()),
    unitPricing: v.optional(
      v.array(
        v.object({
          unitId: v.id("units"),
          salePrice: v.number(), // Price for this unit in cents
          purchasePrice: v.number(), // Cost for this unit in cents
        })
      )
    ),
    unitConversionIds: v.optional(v.array(v.id("unitConversions"))),
    godownStocks: v.optional(
      v.array(
        v.object({
          godownId: v.id("godowns"),
          quantity: v.number(), // Quantity in base unit
        })
      )
    ),
    variations: v.optional(
      v.array(
        v.object({
          name: v.string(), // Color name
          sku: v.string(),
          color: v.string(), // Color value/hex
          barcode: v.optional(v.string()),
          isActive: v.boolean(),
        })
      )
    ),
    images: v.optional(v.array(v.string())),
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

    // Check if SKU already exists
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .first();

    if (existing) {
      throw new Error("Product with this SKU already exists");
    }

    // Calculate stock value
    const stockValue = args.stockQuantity * args.purchasePrice;

    const productId = await ctx.db.insert("products", {
      organizationId: currentUser.organizationId,
      name: args.name,
      sku: args.sku,
      description: args.description,
      barcode: args.barcode,
      brandId: args.brandId,
      categoryId: args.categoryId,
      baseUnitId: args.baseUnitId,
      salePrice: args.salePrice,
      purchasePrice: args.purchasePrice,
      stockQuantity: args.stockQuantity,
      stockValue: stockValue,
      minStockLevel: args.minStockLevel,
      maxStockLevel: args.maxStockLevel ?? 10000,
      unitPricing: args.unitPricing,
      unitConversionIds: args.unitConversionIds,
      godownStocks: args.godownStocks,
      variations: args.variations,
      images: args.images ?? [],
      metadata: args.metadata,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser._id,
    });

    return productId;
  },
});

/**
 * Update a product
 */
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    barcode: v.optional(v.string()),
    brandId: v.optional(v.id("brands")),
    categoryId: v.optional(v.id("categories")),
    salePrice: v.optional(v.number()),
    purchasePrice: v.optional(v.number()),
    stockQuantity: v.optional(v.number()),
    minStockLevel: v.optional(v.number()),
    maxStockLevel: v.optional(v.number()),
    unitPricing: v.optional(
      v.array(
        v.object({
          unitId: v.id("units"),
          salePrice: v.number(),
          purchasePrice: v.number(),
        })
      )
    ),
    unitConversionIds: v.optional(v.array(v.id("unitConversions"))),
    godownStocks: v.optional(
      v.array(
        v.object({
          godownId: v.id("godowns"),
          quantity: v.number(),
        })
      )
    ),
    variations: v.optional(
      v.array(
        v.object({
          name: v.string(),
          sku: v.string(),
          color: v.string(),
          barcode: v.optional(v.string()),
          isActive: v.boolean(),
        })
      )
    ),
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

    const product = await ctx.db.get(args.productId);
    if (!product || product.organizationId !== currentUser.organizationId) {
      throw new Error("Product not found");
    }

    // Calculate stock value if stock quantity or purchase price changed
    const newStockQuantity = args.stockQuantity ?? product.stockQuantity;
    const newPurchasePrice = args.purchasePrice ?? product.purchasePrice;
    const stockValue = newStockQuantity * newPurchasePrice;

    await ctx.db.patch(args.productId, {
      name: args.name ?? product.name,
      description: args.description ?? product.description,
      barcode: args.barcode ?? product.barcode,
      brandId: args.brandId ?? product.brandId,
      categoryId: args.categoryId ?? product.categoryId,
      salePrice: args.salePrice ?? product.salePrice,
      purchasePrice: args.purchasePrice ?? product.purchasePrice,
      stockQuantity: args.stockQuantity ?? product.stockQuantity,
      stockValue: stockValue,
      minStockLevel: args.minStockLevel ?? product.minStockLevel,
      maxStockLevel: args.maxStockLevel ?? product.maxStockLevel,
      unitPricing: args.unitPricing ?? product.unitPricing,
      unitConversionIds: args.unitConversionIds ?? product.unitConversionIds,
      godownStocks: args.godownStocks ?? product.godownStocks,
      variations: args.variations ?? product.variations,
      updatedAt: Date.now(),
    });

    return args.productId;
  },
});

/**
 * Delete a product (soft delete)
 */
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
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

    const product = await ctx.db.get(args.productId);
    if (!product || product.organizationId !== currentUser.organizationId) {
      throw new Error("Product not found");
    }

    // Soft delete
    await ctx.db.patch(args.productId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.productId;
  },
});

