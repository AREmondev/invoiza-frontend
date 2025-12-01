import { describe, it, expect, beforeEach } from '@jest/globals';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import type { InvoiceLineItem, AdditionalCharge } from '@/types/models';

describe('Invoice Calculation Logic', () => {
  let store: any;

  beforeEach(() => {
    // Reset store before each test
    store = useInvoiceStore.getState();
    store.clearInvoice();
  });

  describe('Line Item Calculations', () => {
    it('should calculate line item total correctly', () => {
      const lineItem: InvoiceLineItem = {
        id: 'line_001',
        productId: 'product_001',
        productName: 'Test Product',
        quantity: 5,
        unitPrice: 100,
        unit: 'piece',
        totalPrice: 0,
        additionalCharges: [],
      };

      const calculatedItem = store.calculateLineItemTotal(lineItem);
      
      expect(calculatedItem.totalPrice).toBe(500);
    });

    it('should handle line items with additional charges', () => {
      const additionalCharges: AdditionalCharge[] = [
        {
          id: 'charge_001',
          name: 'Discount',
          type: 'percentage',
          value: 10,
          applyTo: 'line',
          isActive: true,
        },
        {
          id: 'charge_002',
          name: 'Service Fee',
          type: 'fixed',
          value: 25,
          applyTo: 'line',
          isActive: true,
        },
      ];

      const lineItem: InvoiceLineItem = {
        id: 'line_001',
        productId: 'product_001',
        productName: 'Test Product',
        quantity: 2,
        unitPrice: 100,
        unit: 'piece',
        totalPrice: 0,
        additionalCharges: additionalCharges,
      };

      const calculatedItem = store.calculateLineItemTotal(lineItem);
      
      // Base price: 2 * 100 = 200
      // Discount: 200 * 10% = 20 (reduction)
      // Service fee: 25 (addition)
      // Total: 200 - 20 + 25 = 205
      expect(calculatedItem.totalPrice).toBe(205);
    });

    it('should handle inactive additional charges', () => {
      const additionalCharges: AdditionalCharge[] = [
        {
          id: 'charge_001',
          name: 'Discount',
          type: 'percentage',
          value: 10,
          applyTo: 'line',
          isActive: false, // Inactive
        },
        {
          id: 'charge_002',
          name: 'Service Fee',
          type: 'fixed',
          value: 25,
          applyTo: 'line',
          isActive: true,
        },
      ];

      const lineItem: InvoiceLineItem = {
        id: 'line_001',
        productId: 'product_001',
        productName: 'Test Product',
        quantity: 2,
        unitPrice: 100,
        unit: 'piece',
        totalPrice: 0,
        additionalCharges: additionalCharges,
      };

      const calculatedItem = store.calculateLineItemTotal(lineItem);
      
      // Base price: 2 * 100 = 200
      // Discount: 0 (inactive)
      // Service fee: 25 (addition)
      // Total: 200 + 25 = 225
      expect(calculatedItem.totalPrice).toBe(225);
    });

    it('should handle negative additional charges', () => {
      const additionalCharges: AdditionalCharge[] = [
        {
          id: 'charge_001',
          name: 'Discount',
          type: 'percentage',
          value: -10, // Negative discount (surcharge)
          applyTo: 'line',
          isActive: true,
        },
        {
          id: 'charge_002',
          name: 'Negative Fee',
          type: 'fixed',
          value: -15, // Negative fee (credit)
          applyTo: 'line',
          isActive: true,
        },
      ];

      const lineItem: InvoiceLineItem = {
        id: 'line_001',
        productId: 'product_001',
        productName: 'Test Product',
        quantity: 1,
        unitPrice: 100,
        unit: 'piece',
        totalPrice: 0,
        additionalCharges: additionalCharges,
      };

      const calculatedItem = store.calculateLineItemTotal(lineItem);
      
      // Base price: 1 * 100 = 100
      // Negative discount: 100 * -10% = -10 (addition)
      // Negative fee: -15 (reduction)
      // Total: 100 - 10 - 15 = 75
      expect(calculatedItem.totalPrice).toBe(75);
    });
  });

  describe('Invoice Total Calculations', () => {
    it('should calculate subtotal correctly', () => {
      const lineItems: InvoiceLineItem[] = [
        {
          id: 'line_001',
          productId: 'product_001',
          productName: 'Product A',
          quantity: 2,
          unitPrice: 100,
          unit: 'piece',
          totalPrice: 200,
          additionalCharges: [],
        },
        {
          id: 'line_002',
          productId: 'product_002',
          productName: 'Product B',
          quantity: 3,
          unitPrice: 50,
          unit: 'piece',
          totalPrice: 150,
          additionalCharges: [],
        },
      ];

      store.currentInvoice.lineItems = lineItems;
      const totals = store.calculateTotals();
      
      expect(totals.subtotal).toBe(350);
    });

    it('should handle global additional charges', () => {
      const lineItems: InvoiceLineItem[] = [
        {
          id: 'line_001',
          productId: 'product_001',
          productName: 'Product A',
          quantity: 1,
          unitPrice: 100,
          unit: 'piece',
          totalPrice: 100,
          additionalCharges: [],
        },
      ];

      const globalCharges: AdditionalCharge[] = [
        {
          id: 'global_001',
          name: 'Tax',
          type: 'percentage',
          value: 10,
          applyTo: 'total',
          isActive: true,
        },
        {
          id: 'global_002',
          name: 'Shipping',
          type: 'fixed',
          value: 15,
          applyTo: 'total',
          isActive: true,
        },
      ];

      store.currentInvoice.lineItems = lineItems;
      store.currentInvoice.additionalCharges = globalCharges;
      const totals = store.calculateTotals();
      
      // Subtotal: 100
      // Tax: 100 * 10% = 10
      // Shipping: 15
      // Total: 100 + 10 + 15 = 125
      expect(totals.total).toBe(125);
    });

    it('should handle mixed line and global charges', () => {
      const lineItems: InvoiceLineItem[] = [
        {
          id: 'line_001',
          productId: 'product_001',
          productName: 'Product A',
          quantity: 1,
          unitPrice: 100,
          unit: 'piece',
          totalPrice: 100,
          additionalCharges: [
            {
              id: 'line_charge_001',
              name: 'Line Discount',
              type: 'percentage',
              value: 5,
              applyTo: 'line',
              isActive: true,
            },
          ],
        },
      ];

      const globalCharges: AdditionalCharge[] = [
        {
          id: 'global_001',
          name: 'Tax',
          type: 'percentage',
          value: 10,
          applyTo: 'total',
          isActive: true,
        },
      ];

      store.currentInvoice.lineItems = lineItems;
      store.currentInvoice.additionalCharges = globalCharges;
      const totals = store.calculateTotals();
      
      // Line item calculation:
      // Base price: 1 * 100 = 100
      // Line discount: 100 * 5% = 5 (reduction)
      // Line total: 100 - 5 = 95
      
      // Global calculation:
      // Subtotal: 95
      // Tax: 95 * 10% = 9.5 (addition)
      // Total: 95 + 9.5 = 104.5
      expect(totals.total).toBe(104.5);
    });

    it('should handle inactive global charges', () => {
      const lineItems: InvoiceLineItem[] = [
        {
          id: 'line_001',
          productId: 'product_001',
          productName: 'Product A',
          quantity: 1,
          unitPrice: 100,
          unit: 'piece',
          totalPrice: 100,
          additionalCharges: [],
        },
      ];

      const globalCharges: AdditionalCharge[] = [
        {
          id: 'global_001',
          name: 'Tax',
          type: 'percentage',
          value: 10,
          applyTo: 'total',
          isActive: false, // Inactive
        },
        {
          id: 'global_002',
          name: 'Shipping',
          type: 'fixed',
          value: 15,
          applyTo: 'total',
          isActive: true,
        },
      ];

      store.currentInvoice.lineItems = lineItems;
      store.currentInvoice.additionalCharges = globalCharges;
      const totals = store.calculateTotals();
      
      // Subtotal: 100
      // Tax: 0 (inactive)
      // Shipping: 15 (active)
      // Total: 100 + 15 = 115
      expect(totals.total).toBe(115);
    });

    it('should handle zero and negative totals', () => {
      const lineItems: InvoiceLineItem[] = [
        {
          id: 'line_001',
          productId: 'product_001',
          productName: 'Product A',
          quantity: 1,
          unitPrice: 0,
          unit: 'piece',
          totalPrice: 0,
          additionalCharges: [],
        },
      ];

      const globalCharges: AdditionalCharge[] = [
        {
          id: 'global_001',
          name: 'Credit',
          type: 'fixed',
          value: -50,
          applyTo: 'total',
          isActive: true,
        },
      ];

      store.currentInvoice.lineItems = lineItems;
      store.currentInvoice.additionalCharges = globalCharges;
      const totals = store.calculateTotals();
      
      // Subtotal: 0
      // Credit: -50 (reduction)
      // Total: 0 - 50 = -50
      expect(totals.total).toBe(-50);
    });
  });

  describe('Invoice State Management', () => {
    it('should add line items correctly', () => {
      const lineItem: InvoiceLineItem = {
        id: 'line_001',
        productId: 'product_001',
        productName: 'Test Product',
        quantity: 1,
        unitPrice: 100,
        unit: 'piece',
        totalPrice: 100,
        additionalCharges: [],
      };

      store.addLineItem(lineItem);
      
      expect(store.currentInvoice.lineItems.length).toBe(1);
      expect(store.currentInvoice.lineItems[0]).toEqual(lineItem);
    });

    it('should update line items correctly', () => {
      const lineItem: InvoiceLineItem = {
        id: 'line_001',
        productId: 'product_001',
        productName: 'Test Product',
        quantity: 1,
        unitPrice: 100,
        unit: 'piece',
        totalPrice: 100,
        additionalCharges: [],
      };

      store.addLineItem(lineItem);
      
      const updates = {
        quantity: 2,
        unitPrice: 150,
      };

      store.updateLineItem('line_001', updates);
      
      expect(store.currentInvoice.lineItems[0].quantity).toBe(2);
      expect(store.currentInvoice.lineItems[0].unitPrice).toBe(150);
    });

    it('should remove line items correctly', () => {
      const lineItem1: InvoiceLineItem = {
        id: 'line_001',
        productId: 'product_001',
        productName: 'Product A',
        quantity: 1,
        unitPrice: 100,
        unit: 'piece',
        totalPrice: 100,
        additionalCharges: [],
      };

      const lineItem2: InvoiceLineItem = {
        id: 'line_002',
        productId: 'product_002',
        productName: 'Product B',
        quantity: 1,
        unitPrice: 200,
        unit: 'piece',
        totalPrice: 200,
        additionalCharges: [],
      };

      store.addLineItem(lineItem1);
      store.addLineItem(lineItem2);
      
      expect(store.currentInvoice.lineItems.length).toBe(2);
      
      store.removeLineItem('line_001');
      
      expect(store.currentInvoice.lineItems.length).toBe(1);
      expect(store.currentInvoice.lineItems[0].id).toBe('line_002');
    });

    it('should clear invoice correctly', () => {
      const lineItem: InvoiceLineItem = {
        id: 'line_001',
        productId: 'product_001',
        productName: 'Test Product',
        quantity: 1,
        unitPrice: 100,
        unit: 'piece',
        totalPrice: 100,
        additionalCharges: [],
      };

      store.addLineItem(lineItem);
      store.addAdditionalCharge({
        id: 'charge_001',
        name: 'Tax',
        type: 'percentage',
        value: 10,
        applyTo: 'total',
        isActive: true,
      });
      
      expect(store.currentInvoice.lineItems.length).toBe(1);
      expect(store.currentInvoice.additionalCharges.length).toBe(1);
      
      store.clearInvoice();
      
      expect(store.currentInvoice.lineItems.length).toBe(0);
      expect(store.currentInvoice.additionalCharges.length).toBe(0);
      expect(store.currentInvoice.subtotal).toBe(0);
      expect(store.currentInvoice.total).toBe(0);
    });
  });

  describe('Additional Charge Management', () => {
    it('should add additional charges correctly', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Tax',
        type: 'percentage',
        value: 10,
        applyTo: 'total',
        isActive: true,
      };

      store.addAdditionalCharge(charge);
      
      expect(store.currentInvoice.additionalCharges.length).toBe(1);
      expect(store.currentInvoice.additionalCharges[0]).toEqual(charge);
    });

    it('should update additional charges correctly', () => {
      const charge: AdditionalCharge = {
        id: 'charge_001',
        name: 'Tax',
        type: 'percentage',
        value: 10,
        applyTo: 'total',
        isActive: true,
      };

      store.addAdditionalCharge(charge);
      
      const updates = {
        value: 15,
        name: 'Updated Tax',
      };

      store.updateAdditionalCharge('charge_001', updates);
      
      expect(store.currentInvoice.additionalCharges[0].value).toBe(15);
      expect(store.currentInvoice.additionalCharges[0].name).toBe('Updated Tax');
    });

    it('should remove additional charges correctly', () => {
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
        name: 'Shipping',
        type: 'fixed',
        value: 25,
        applyTo: 'total',
        isActive: true,
      };

      store.addAdditionalCharge(charge1);
      store.addAdditionalCharge(charge2);
      
      expect(store.currentInvoice.additionalCharges.length).toBe(2);
      
      store.removeAdditionalCharge('charge_001');
      
      expect(store.currentInvoice.additionalCharges.length).toBe(1);
      expect(store.currentInvoice.additionalCharges[0].id).toBe('charge_002');
    });
  });

  describe('Agreement Warning Logic', () => {
    it('should generate warnings for price violations', () => {
      // This would require mocking the product store's price agreement checking
      // For now, we'll test the basic structure
      const warnings = store.getAgreementWarnings();
      
      expect(Array.isArray(warnings)).toBe(true);
    });

    it('should handle force action on price violations', () => {
      const action = 'force';
      const result = store.handlePriceViolationAction(action);
      
      expect(result).toBe(true); // Should allow the action
    });

    it('should handle abort action on price violations', () => {
      const action = 'abort';
      const result = store.handlePriceViolationAction(action);
      
      expect(result).toBe(false); // Should prevent the action
    });
  });
});