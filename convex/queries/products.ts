import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all products for an organization
 */
export const getProducts = query({
  args: {
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user
    let currentUser = null;
    if (args.userEmail) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.userEmail!))
        .first();
    }

    if (!currentUser) {
      return [];
    }

    const products = await ctx.db
      .query("products")
      .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Populate related data
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const brand = product.brandId
          ? await ctx.db.get(product.brandId)
          : null;
        const category = product.categoryId
          ? await ctx.db.get(product.categoryId)
          : null;
        const baseUnit = await ctx.db.get(product.baseUnitId);

        // Get unit pricing details
        const unitPricingDetails = product.unitPricing
          ? await Promise.all(
              product.unitPricing.map(async (up: any) => {
                const unit = await ctx.db.get(up.unitId);
                return {
                  ...up,
                  unit,
                };
              })
            )
          : [];

        // Get conversion details
        const conversionDetails = product.unitConversionIds
          ? await Promise.all(
              product.unitConversionIds.map(async (convId: any) => {
                const conv = await ctx.db.get(convId);
                if (conv) {
                  const baseUnit = await ctx.db.get(conv.baseUnitId);
                  const secondaryUnit = await ctx.db.get(conv.secondaryUnitId);
                  return {
                    ...conv,
                    baseUnit,
                    secondaryUnit,
                  };
                }
                return null;
              })
            )
          : [];

        return {
          ...product,
          brand,
          category,
          baseUnit,
          unitPricingDetails,
          conversionDetails: conversionDetails.filter((c) => c !== null),
        };
      })
    );

    return productsWithDetails;
  },
});

/**
 * Get a single product by ID
 */
export const getProduct = query({
  args: {
    productId: v.id("products"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    // Populate related data
    const brand = product.brandId ? await ctx.db.get(product.brandId) : null;
    const category = product.categoryId
      ? await ctx.db.get(product.categoryId)
      : null;
    const baseUnit = await ctx.db.get(product.baseUnitId);

    return {
      ...product,
      brand,
      category,
      baseUnit,
    };
  },
});

