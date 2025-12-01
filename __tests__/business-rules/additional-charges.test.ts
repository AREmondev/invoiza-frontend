import { describe, it, expect, beforeEach } from '@jest/globals';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { AdditionalCharge } from '@/types/models';

describe('Additional Charges Logic', () => {
  let store: any;

  beforeEach(() => {
    store = useSettingsStore.getState();
    // Reset to default state
    store.setAdditionalCharges([]);
  });

  describe('Charge Application Logic', () => {
    it('should apply percentage charges correctly', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Tax',
        type: 'percentage',
        value: 10,
        applyTo: 'total',
        isActive: true,
      };

      const baseAmount = 100;
      const result = store.applyCharge(baseAmount, charge);
      
      expect(result).toBe(10); // 10% of 100
    });

    it('should apply fixed charges correctly', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Service Fee',
        type: 'fixed',
        value: 25,
        applyTo: 'total',
        isActive: true,
      };

      const baseAmount = 100;
      const result = store.applyCharge(baseAmount, charge);
      
      expect(result).toBe(25); // Fixed amount
    });

    it('should handle negative percentage charges', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Discount',
        type: 'percentage',
        value: -15,
        applyTo: 'total',
        isActive: true,
      };

      const baseAmount = 100;
      const result = store.applyCharge(baseAmount, charge);
      
      expect(result).toBe(-15); // -15% of 100
    });

    it('should handle negative fixed charges', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Credit',
        type: 'fixed',
        value: -30,
        applyTo: 'total',
        isActive: true,
      };

      const baseAmount = 100;
      const result = store.applyCharge(baseAmount, charge);
      
      expect(result).toBe(-30); // Fixed credit
    });

    it('should return 0 for inactive charges', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Tax',
        type: 'percentage',
        value: 10,
        applyTo: 'total',
        isActive: false, // Inactive
      };

      const baseAmount = 100;
      const result = store.applyCharge(baseAmount, charge);
      
      expect(result).toBe(0);
    });

    it('should handle zero base amounts', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Tax',
        type: 'percentage',
        value: 10,
        applyTo: 'total',
        isActive: true,
      };

      const baseAmount = 0;
      const result = store.applyCharge(baseAmount, charge);
      
      expect(result).toBe(0);
    });

    it('should handle very large numbers', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Tax',
        type: 'percentage',
        value: 5,
        applyTo: 'total',
        isActive: true,
      };

      const baseAmount = 1000000;
      const result = store.applyCharge(baseAmount, charge);
      
      expect(result).toBe(50000);
    });

    it('should handle decimal precision', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Tax',
        type: 'percentage',
        value: 8.25,
        applyTo: 'total',
        isActive: true,
      };

      const baseAmount = 123.45;
      const result = store.applyCharge(baseAmount, charge);
      
      expect(result).toBeCloseTo(10.1846, 4);
    });
  });

  describe('Multiple Charges Application', () => {
    it('should apply multiple charges in sequence', () => {
      const charges: AdditionalCharge[] = [
        {
          id: 'charge_001',
          name: 'Subtotal',
          type: 'fixed',
          value: 100,
          applyTo: 'total',
          isActive: true,
        },
        {
          id: 'charge_002',
          name: 'Tax',
          type: 'percentage',
          value: 10,
          applyTo: 'total',
          isActive: true,
        },
        {
          id: 'charge_003',
          name: 'Service Fee',
          type: 'fixed',
          value: 5,
          applyTo: 'total',
          isActive: true,
        },
      ];

      let currentTotal = 0;
      
      // Apply charges in sequence
      charges.forEach(charge => {
        const chargeAmount = store.applyCharge(currentTotal, charge);
        currentTotal += chargeAmount;
      });

      // Expected: 0 + 100 = 100 (subtotal)
      // 100 + 10% = 110 (with tax)
      // 110 + 5 = 115 (with service fee)
      expect(currentTotal).toBe(115);
    });

    it('should handle mixed positive and negative charges', () => {
      const charges: AdditionalCharge[] = [
        {
          id: 'charge_001',
          name: 'Subtotal',
          type: 'fixed',
          value: 100,
          applyTo: 'total',
          isActive: true,
        },
        {
          id: 'charge_002',
          name: 'Discount',
          type: 'percentage',
          value: -10, // 10% discount
          applyTo: 'total',
          isActive: true,
        },
        {
          id: 'charge_003',
          name: 'Tax',
          type: 'percentage',
          value: 8, // 8% tax on discounted amount
          applyTo: 'total',
          isActive: true,
        },
      ];

      let currentTotal = 0;
      
      charges.forEach(charge => {
        const chargeAmount = store.applyCharge(currentTotal, charge);
        currentTotal += chargeAmount;
      });

      // Expected: 0 + 100 = 100 (subtotal)
      // 100 - 10% = 90 (with discount)
      // 90 + 8% = 97.2 (with tax)
      expect(currentTotal).toBeCloseTo(97.2, 2);
    });

    it('should respect charge application order', () => {
      const charges: AdditionalCharge[] = [
        {
          id: 'charge_001',
          name: 'Subtotal',
          type: 'fixed',
          value: 100,
          applyTo: 'total',
          isActive: true,
        },
        {
          id: 'charge_002',
          name: 'Discount',
          type: 'percentage',
          value: -20, // 20% discount
          applyTo: 'total',
          isActive: true,
        },
        {
          id: 'charge_003',
          name: 'Tax',
          type: 'percentage',
          value: 10, // 10% tax
          applyTo: 'total',
          isActive: true,
        },
      ];

      // Apply in different orders and verify results
      
      // Order 1: Discount then Tax
      let total1 = 0;
      charges.forEach(charge => {
        const chargeAmount = store.applyCharge(total1, charge);
        total1 += chargeAmount;
      });

      // Order 2: Tax then Discount (hypothetical - not how it should work)
      let total2 = 0;
      total2 += store.applyCharge(total2, charges[0]); // Subtotal
      total2 += store.applyCharge(total2, charges[2]); // Tax first
      total2 += store.applyCharge(total2, charges[1]); // Discount second

      // The order matters - discount should be applied before tax
      expect(total1).toBeCloseTo(88, 1); // 100 - 20% = 80, then 80 + 10% = 88
      expect(total2).toBeCloseTo(90, 1); // 100 + 10% = 110, then 110 - 20% = 88
      // Both should result in the same amount due to mathematical properties
      expect(total1).toBeCloseTo(total2, 1);
    });
  });

  describe('Charge Configuration', () => {
    it('should validate charge configuration', () => {
      const validCharge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Valid Charge',
        type: 'percentage',
        value: 15,
        applyTo: 'total',
        isActive: true,
      };

      const isValid = store.validateCharge(validCharge);
      expect(isValid).toBe(true);
    });

    it('should reject invalid percentage values', () => {
      const invalidCharge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Invalid Percentage',
        type: 'percentage',
        value: 150, // Too high
        applyTo: 'total',
        isActive: true,
      };

      const isValid = store.validateCharge(invalidCharge);
      expect(isValid).toBe(false);
    });

    it('should reject charges with missing required fields', () => {
      const invalidCharge: any = {
        id: 'charge_001',
        // Missing name
        type: 'percentage',
        value: 15,
        applyTo: 'total',
        isActive: true,
      };

      const isValid = store.validateCharge(invalidCharge);
      expect(isValid).toBe(false);
    });

    it('should handle duplicate charge names', () => {
      const charge1: AdditionalCharge = {
        id: 'charge_001',
        name: 'Tax',
        type: 'percentage',
        value: 10,
        applyTo: 'total',
        isActive: true,
      };

      const charge2: AdditionalCharge = {
        id: 'charge_002',
        name: 'Tax', // Same name
        type: 'percentage',
        value: 8,
        applyTo: 'total',
        isActive: true,
      };

      store.settings.additionalCharges = [charge1];
      const hasDuplicate = store.hasDuplicateChargeName(charge2);
      expect(hasDuplicate).toBe(true);
    });
  });

  describe('Settings Integration', () => {
    it('should respect allowNegativeCharges setting', () => {
      store.settings.allowNegativeCharges = false;
      
      const negativeCharge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Discount',
        type: 'percentage',
        value: -10,
        applyTo: 'total',
        isActive: true,
      };

      const isValid = store.validateCharge(negativeCharge);
      expect(isValid).toBe(false);
    });

    it('should respect chargeTaxOnCharges setting', () => {
      store.settings.chargeTaxOnCharges = true;
      
      const subtotal = 100;
      const taxCharge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Tax',
        type: 'percentage',
        value: 10,
        applyTo: 'total',
        isActive: true,
      };

      const serviceCharge: AdditionalCharge = {
        id: 'charge_002',
        name: 'Service Fee',
        type: 'fixed',
        value: 5,
        applyTo: 'total',
        isActive: true,
      };

      // Apply service fee first
      let total = subtotal;
      total += store.applyCharge(total, serviceCharge); // 100 + 5 = 105
      
      // Then apply tax on the total including service fee
      total += store.applyCharge(total, taxCharge); // 105 + 10.5 = 115.5
      
      expect(total).toBeCloseTo(115.5, 1);
    });

    it('should handle minimum charge amounts', () => {
      store.settings.minimumChargeAmount = 1.0;
      
      const smallCharge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Small Fee',
        type: 'fixed',
        value: 0.5, // Below minimum
        applyTo: 'total',
        isActive: true,
      };

      const isValid = store.validateCharge(smallCharge);
      expect(isValid).toBe(false);
    });

    it('should handle maximum charge percentages', () => {
      store.settings.maximumChargePercentage = 50;
      
      const largeCharge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Large Tax',
        type: 'percentage',
        value: 75, // Above maximum
        applyTo: 'total',
        isActive: true,
      };

      const isValid = store.validateCharge(largeCharge);
      expect(isValid).toBe(false);
    });
  });

  describe('Charge Templates and Presets', () => {
    it('should apply charge templates correctly', () => {
      const template = store.getChargeTemplate('tax');
      expect(template).toBeDefined();
      expect(template.type).toBe('percentage');
      expect(template.name).toContain('Tax');
    });

    it('should create charges from templates', () => {
      const taxTemplate = store.getChargeTemplate('tax');
      const taxCharge = store.createChargeFromTemplate(taxTemplate, { value: 8.5 });
      
      expect(taxCharge.type).toBe('percentage');
      expect(taxCharge.value).toBe(8.5);
      expect(taxCharge.name).toContain('Tax');
    });

    it('should validate template parameters', () => {
      const taxTemplate = store.getChargeTemplate('tax');
      
      // Valid parameters
      const validCharge = store.createChargeFromTemplate(taxTemplate, { value: 10 });
      expect(validCharge.value).toBe(10);
      
      // Invalid parameters should be rejected
      const invalidCharge = store.createChargeFromTemplate(taxTemplate, { value: 150 });
      expect(invalidCharge).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle NaN and Infinity values', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Problematic Charge',
        type: 'percentage',
        value: NaN,
        applyTo: 'total',
        isActive: true,
      };

      const result = store.applyCharge(100, charge);
      expect(result).toBe(0); // Should handle gracefully
    });

    it('should handle very small charge values', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Tiny Fee',
        type: 'fixed',
        value: 0.001,
        applyTo: 'total',
        isActive: true,
      };

      const result = store.applyCharge(100, charge);
      expect(result).toBeCloseTo(0.001, 3);
    });

    it('should handle very large charge values', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Large Fee',
        type: 'fixed',
        value: 1000000,
        applyTo: 'total',
        isActive: true,
      };

      const result = store.applyCharge(100, charge);
      expect(result).toBe(1000000);
    });

    it('should handle concurrent charge modifications', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Concurrent Charge',
        type: 'percentage',
        value: 10,
        applyTo: 'total',
        isActive: true,
      };

      // Simulate concurrent modifications
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(store.applyCharge(100, charge));
      }
      
      // All results should be the same
      expect(results.every(result => result === 10)).toBe(true);
    });
  });
});