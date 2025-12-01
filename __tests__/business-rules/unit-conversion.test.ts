import { describe, it, expect } from '@jest/globals';
import { useProductStore } from '@/store/useProductStore';
import type { Product, UnitConversion } from '@/types/models';

describe('Unit Conversion Logic', () => {
  let store: any;

  beforeEach(() => {
    store = useProductStore.getState();
  });

  describe('Basic Unit Conversions', () => {
    it('should convert between simple units correctly', () => {
      const conversions: UnitConversion[] = [
        { unit: 'piece', conversionFactor: 1, price: 10 },
        { unit: 'dozen', conversionFactor: 12, price: 110 },
        { unit: 'gross', conversionFactor: 144, price: 1200 },
      ];

      // Test piece to dozen
      expect(store.convertUnit(12, 'piece', 'dozen', conversions)).toBe(1);
      expect(store.convertUnit(24, 'piece', 'dozen', conversions)).toBe(2);
      expect(store.convertUnit(1, 'piece', 'dozen', conversions)).toBeCloseTo(0.0833, 3);

      // Test dozen to piece
      expect(store.convertUnit(1, 'dozen', 'piece', conversions)).toBe(12);
      expect(store.convertUnit(2, 'dozen', 'piece', conversions)).toBe(24);

      // Test piece to gross
      expect(store.convertUnit(144, 'piece', 'gross', conversions)).toBe(1);
      expect(store.convertUnit(288, 'piece', 'gross', conversions)).toBe(2);

      // Test gross to piece
      expect(store.convertUnit(1, 'gross', 'piece', conversions)).toBe(144);
      expect(store.convertUnit(0.5, 'gross', 'piece', conversions)).toBe(72);
    });

    it('should handle weight-based conversions', () => {
      const conversions: UnitConversion[] = [
        { unit: 'kg', conversionFactor: 1, price: 100 },
        { unit: 'g', conversionFactor: 0.001, price: 0.1 },
        { unit: 'lb', conversionFactor: 0.453592, price: 45.36 },
        { unit: 'oz', conversionFactor: 0.0283495, price: 2.83 },
      ];

      // Test kg to g
      expect(store.convertUnit(1, 'kg', 'g', conversions)).toBe(1000);
      expect(store.convertUnit(0.5, 'kg', 'g', conversions)).toBe(500);

      // Test g to kg
      expect(store.convertUnit(1000, 'g', 'kg', conversions)).toBe(1);
      expect(store.convertUnit(250, 'g', 'kg', conversions)).toBe(0.25);

      // Test kg to lb
      expect(store.convertUnit(1, 'kg', 'lb', conversions)).toBeCloseTo(2.20462, 3);
      expect(store.convertUnit(2, 'kg', 'lb', conversions)).toBeCloseTo(4.40924, 3);

      // Test lb to kg
      expect(store.convertUnit(1, 'lb', 'kg', conversions)).toBeCloseTo(0.453592, 3);
      expect(store.convertUnit(2.20462, 'lb', 'kg', conversions)).toBeCloseTo(1, 3);
    });

    it('should handle volume-based conversions', () => {
      const conversions: UnitConversion[] = [
        { unit: 'l', conversionFactor: 1, price: 50 },
        { unit: 'ml', conversionFactor: 0.001, price: 0.05 },
        { unit: 'gal', conversionFactor: 3.78541, price: 189.27 },
        { unit: 'fl_oz', conversionFactor: 0.0295735, price: 1.48 },
      ];

      // Test l to ml
      expect(store.convertUnit(1, 'l', 'ml', conversions)).toBe(1000);
      expect(store.convertUnit(0.75, 'l', 'ml', conversions)).toBe(750);

      // Test ml to l
      expect(store.convertUnit(1000, 'ml', 'l', conversions)).toBe(1);
      expect(store.convertUnit(250, 'ml', 'l', conversions)).toBe(0.25);

      // Test l to gal
      expect(store.convertUnit(1, 'l', 'gal', conversions)).toBeCloseTo(0.264172, 3);
      expect(store.convertUnit(3.78541, 'l', 'gal', conversions)).toBeCloseTo(1, 3);

      // Test gal to l
      expect(store.convertUnit(1, 'gal', 'l', conversions)).toBeCloseTo(3.78541, 3);
      expect(store.convertUnit(0.264172, 'gal', 'l', conversions)).toBeCloseTo(1, 3);
    });
  });

  describe('Price Calculations with Unit Conversions', () => {
    it('should calculate unit prices correctly after conversion', () => {
      const conversions: UnitConversion[] = [
        { unit: 'piece', conversionFactor: 1, price: 10 },
        { unit: 'dozen', conversionFactor: 12, price: 110 },
        { unit: 'gross', conversionFactor: 144, price: 1200 },
      ];

      // When converting quantity, price should be proportional
      const basePrice = 10; // price per piece
      
      // Convert 1 dozen to pieces (should be 12 pieces)
      const dozenToPieces = store.convertUnit(1, 'dozen', 'piece', conversions);
      expect(dozenToPieces).toBe(12);
      
      // The price per dozen should be 12 * price per piece with bulk discount
      const expectedDozenPrice = 110;
      const actualDozenPrice = conversions.find(c => c.unit === 'dozen')?.price;
      expect(actualDozenPrice).toBe(expectedDozenPrice);
      
      // Check that bulk pricing provides discount
      const individualPriceForDozen = basePrice * 12; // 120
      expect(actualDozenPrice).toBeLessThan(individualPriceForDozen);
    });

    it('should handle complex pricing scenarios', () => {
      const conversions: UnitConversion[] = [
        { unit: 'piece', conversionFactor: 1, price: 5 },
        { unit: 'pack', conversionFactor: 6, price: 28 }, // 6 pieces
        { unit: 'box', conversionFactor: 24, price: 108 }, // 24 pieces (4 packs)
        { unit: 'case', conversionFactor: 144, price: 600 }, // 144 pieces (6 boxes)
      ];

      // Verify bulk discounts are applied correctly
      const individualPriceForPack = 5 * 6; // 30
      const packPrice = conversions.find(c => c.unit === 'pack')?.price; // 28
      expect(packPrice).toBeLessThan(individualPriceForPack);

      const individualPriceForBox = 5 * 24; // 120
      const boxPrice = conversions.find(c => c.unit === 'box')?.price; // 108
      expect(boxPrice).toBeLessThan(individualPriceForBox);

      const individualPriceForCase = 5 * 144; // 720
      const casePrice = conversions.find(c => c.unit === 'case')?.price; // 600
      expect(casePrice).toBeLessThan(individualPriceForCase);

      // Test conversion accuracy
      expect(store.convertUnit(1, 'case', 'piece', conversions)).toBe(144);
      expect(store.convertUnit(1, 'case', 'box', conversions)).toBe(6);
      expect(store.convertUnit(1, 'case', 'pack', conversions)).toBe(24);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle same unit conversion', () => {
      const conversions: UnitConversion[] = [
        { unit: 'piece', conversionFactor: 1, price: 10 },
        { unit: 'dozen', conversionFactor: 12, price: 110 },
      ];

      expect(store.convertUnit(5, 'piece', 'piece', conversions)).toBe(5);
      expect(store.convertUnit(10, 'dozen', 'dozen', conversions)).toBe(10);
    });

    it('should handle missing conversion data', () => {
      const conversions: UnitConversion[] = [
        { unit: 'piece', conversionFactor: 1, price: 10 },
        { unit: 'dozen', conversionFactor: 12, price: 110 },
      ];

      // Should return original quantity when target unit not found
      expect(store.convertUnit(5, 'piece', 'missing_unit', conversions)).toBe(5);
      expect(store.convertUnit(5, 'missing_unit', 'piece', conversions)).toBe(5);
      expect(store.convertUnit(5, 'missing_unit', 'another_missing', conversions)).toBe(5);
    });

    it('should handle zero quantities', () => {
      const conversions: UnitConversion[] = [
        { unit: 'piece', conversionFactor: 1, price: 10 },
        { unit: 'dozen', conversionFactor: 12, price: 110 },
      ];

      expect(store.convertUnit(0, 'piece', 'dozen', conversions)).toBe(0);
      expect(store.convertUnit(0, 'dozen', 'piece', conversions)).toBe(0);
    });

    it('should handle negative quantities', () => {
      const conversions: UnitConversion[] = [
        { unit: 'piece', conversionFactor: 1, price: 10 },
        { unit: 'dozen', conversionFactor: 12, price: 110 },
      ];

      expect(store.convertUnit(-12, 'piece', 'dozen', conversions)).toBe(-1);
      expect(store.convertUnit(-24, 'piece', 'dozen', conversions)).toBe(-2);
      expect(store.convertUnit(-1, 'dozen', 'piece', conversions)).toBe(-12);
    });

    it('should handle very large quantities', () => {
      const conversions: UnitConversion[] = [
        { unit: 'piece', conversionFactor: 1, price: 10 },
        { unit: 'dozen', conversionFactor: 12, price: 110 },
      ];

      const largeQuantity = 1000000;
      expect(store.convertUnit(largeQuantity, 'piece', 'dozen', conversions)).toBe(largeQuantity / 12);
      expect(store.convertUnit(largeQuantity, 'dozen', 'piece', conversions)).toBe(largeQuantity * 12);
    });

    it('should handle very small conversion factors', () => {
      const conversions: UnitConversion[] = [
        { unit: 'kg', conversionFactor: 1, price: 100 },
        { unit: 'mg', conversionFactor: 0.000001, price: 0.0001 },
      ];

      expect(store.convertUnit(1, 'kg', 'mg', conversions)).toBe(1000000);
      expect(store.convertUnit(0.001, 'kg', 'mg', conversions)).toBe(1000);
      expect(store.convertUnit(1000000, 'mg', 'kg', conversions)).toBe(1);
    });
  });

  describe('Fractional Conversions', () => {
    it('should handle fractional results accurately', () => {
      const conversions: UnitConversion[] = [
        { unit: 'piece', conversionFactor: 1, price: 10 },
        { unit: 'dozen', conversionFactor: 12, price: 110 },
      ];

      // 1 piece to dozen should be 1/12
      const result = store.convertUnit(1, 'piece', 'dozen', conversions);
      expect(result).toBeCloseTo(0.083333, 5);
      
      // 5 pieces to dozen should be 5/12
      const result5 = store.convertUnit(5, 'piece', 'dozen', conversions);
      expect(result5).toBeCloseTo(0.416667, 5);
    });

    it('should maintain precision in complex conversions', () => {
      const conversions: UnitConversion[] = [
        { unit: 'l', conversionFactor: 1, price: 50 },
        { unit: 'tbsp', conversionFactor: 0.0147868, price: 0.739 }, // tablespoon
        { unit: 'tsp', conversionFactor: 0.00492892, price: 0.246 }, // teaspoon
      ];

      // 1 liter to tablespoons
      const tbspInLiter = store.convertUnit(1, 'l', 'tbsp', conversions);
      expect(tbspInLiter).toBeCloseTo(67.628, 2);

      // 1 tablespoon to teaspoons (should be 3)
      const tspInTbsp = store.convertUnit(1, 'tbsp', 'tsp', conversions);
      expect(tspInTbsp).toBeCloseTo(3, 1);
    });
  });

  describe('Business Logic Integration', () => {
    it('should integrate with product pricing', () => {
      const product: Product = {
        id: 'product_001',
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'Test product',
        baseUnit: 'piece',
        purchasePrice: 50,
        salePrice: 100,
        stockQuantity: 100,
        minStockLevel: 10,
        categoryId: 'category_001',
        brand: 'Test Brand',
        supplier: 'Test Supplier',
        isActive: true,
        units: [
          { unit: 'piece', conversionFactor: 1, price: 100 },
          { unit: 'dozen', conversionFactor: 12, price: 1100 },
          { unit: 'box', conversionFactor: 24, price: 2000 },
        ],
        variations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
      };

      // Customer wants to buy 2 boxes, but we need to calculate in pieces
      const quantityInBoxes = 2;
      const quantityInPieces = store.convertUnit(quantityInBoxes, 'box', 'piece', product.units!);
      expect(quantityInPieces).toBe(48); // 2 boxes * 24 pieces per box

      // Calculate total price
      const pricePerBox = product.units!.find(u => u.unit === 'box')?.price || 0;
      const totalPrice = pricePerBox * quantityInBoxes;
      expect(totalPrice).toBe(4000); // 2000 per box * 2 boxes

      // Verify bulk pricing is better than individual pieces
      const individualPiecePrice = product.salePrice * quantityInPieces; // 100 * 48 = 4800
      expect(totalPrice).toBeLessThan(individualPiecePrice);
    });
  });
});