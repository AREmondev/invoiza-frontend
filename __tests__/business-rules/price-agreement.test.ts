import { describe, it, expect, beforeEach } from '@jest/globals';
import { useProductStore } from '@/store/useProductStore';
import type { Product, PriceAgreement, Customer } from '@/types/models';

// Mock data for testing
const mockProducts: Product[] = [
  {
    id: 'product_001',
    name: 'Test Product',
    sku: 'TEST-001',
    description: 'Test product for unit tests',
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
      { unit: 'box', conversionFactor: 24, price: 2200 },
    ],
    variations: [
      {
        id: 'variation_001',
        name: 'Large',
        sku: 'TEST-001-L',
        salePrice: 120,
        purchasePrice: 60,
        attributes: { size: 'large' },
      },
      {
        id: 'variation_002',
        name: 'Small',
        sku: 'TEST-001-S',
        salePrice: 80,
        purchasePrice: 40,
        attributes: { size: 'small' },
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    updatedBy: 'system',
  },
];

const mockPriceAgreements: PriceAgreement[] = [
  {
    id: 'agreement_001',
    customerId: 'customer_001',
    productId: 'product_001',
    variationId: null,
    unit: 'piece',
    agreedPrice: 90,
    minimumQuantity: 10,
    maximumQuantity: 100,
    validFrom: new Date('2024-01-01').toISOString(),
    validTo: new Date('2024-12-31').toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    updatedBy: 'system',
  },
  {
    id: 'agreement_002',
    customerId: 'customer_001',
    productId: 'product_001',
    variationId: 'variation_001',
    unit: 'piece',
    agreedPrice: 110,
    minimumQuantity: 5,
    maximumQuantity: 50,
    validFrom: new Date('2024-01-01').toISOString(),
    validTo: new Date('2024-12-31').toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    updatedBy: 'system',
  },
];

const mockCustomers: Customer[] = [
  {
    id: 'customer_001',
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+1234567890',
    address: '123 Test Street',
    city: 'Test City',
    country: 'Test Country',
    postalCode: '12345',
    taxId: 'TAX123456',
    creditLimit: 10000,
    paymentTerms: 30,
    billingAliases: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    updatedBy: 'system',
  },
];

describe('Price Agreement Logic', () => {
  let store: any;

  beforeEach(() => {
    // Reset store before each test
    store = useProductStore.getState();
    store.products = mockProducts;
    store.priceAgreements = mockPriceAgreements;
    store.customers = mockCustomers;
    
    // Add mock price history data
    store.priceHistory = [
      {
        id: 'history_001',
        productId: 'product_001',
        customerId: 'customer_001',
        customerName: 'Test Customer',
        variationId: null,
        unit: 'piece',
        unitPriceCents: 90,
        quantity: 20,
        invoiceId: 'invoice_001',
        invoiceDate: new Date('2024-01-15'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        id: 'history_002',
        productId: 'product_001',
        customerId: 'customer_001',
        customerName: 'Test Customer',
        variationId: null,
        unit: 'piece',
        unitPriceCents: 95,
        quantity: 15,
        invoiceId: 'invoice_002',
        invoiceDate: new Date('2024-02-01'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
      },
    ];
  });

  describe('checkPriceAgreement', () => {
    it('should return compliant when price matches agreement exactly', () => {
      const result = store.checkPriceAgreement(
        'product_001',
        90,
        20,
        'piece',
        'customer_001'
      );

      expect(result.isCompliant).toBe(true);
      expect(result.message).toBe('Price complies with agreement');
      expect(result.agreementId).toBe('agreement_001');
    });

    it('should return compliant when price is within tolerance', () => {
      const result = store.checkPriceAgreement(
        'product_001',
        92,
        20,
        'piece',
        'customer_001'
      );

      expect(result.isCompliant).toBe(true);
      expect(result.message).toBe('Price complies with agreement');
    });

    it('should return non-compliant when price is below agreement', () => {
      const result = store.checkPriceAgreement(
        'product_001',
        85,
        20,
        'piece',
        'customer_001'
      );

      expect(result.isCompliant).toBe(false);
      expect(result.message).toContain('violates price agreement');
      expect(result.agreementId).toBe('agreement_001');
    });

    it('should return non-compliant when price is above agreement', () => {
      const result = store.checkPriceAgreement(
        'product_001',
        95,
        20,
        'piece',
        'customer_001'
      );

      expect(result.isCompliant).toBe(false);
      expect(result.message).toContain('violates price agreement');
    });

    it('should handle variation-specific agreements', () => {
      const result = store.checkPriceAgreement(
        'product_001',
        110,
        10,
        'piece',
        'customer_001',
        'variation_001'
      );

      expect(result.isCompliant).toBe(true);
      expect(result.agreementId).toBe('agreement_002');
    });

    it('should handle quantity constraints', () => {
      // Below minimum quantity
      let result = store.checkPriceAgreement(
        'product_001',
        90,
        5,
        'piece',
        'customer_001'
      );
      expect(result.isCompliant).toBe(false);

      // Above maximum quantity
      result = store.checkPriceAgreement(
        'product_001',
        90,
        150,
        'piece',
        'customer_001'
      );
      expect(result.isCompliant).toBe(false);

      // Within quantity range
      result = store.checkPriceAgreement(
        'product_001',
        90,
        50,
        'piece',
        'customer_001'
      );
      expect(result.isCompliant).toBe(true);
    });

    it('should handle unit conversions', () => {
      const result = store.checkPriceAgreement(
        'product_001',
        1080, // 90 * 12 for dozen
        2,
        'dozen',
        'customer_001'
      );

      expect(result.isCompliant).toBe(true);
    });

    it('should return no agreement found when no agreement exists', () => {
      const result = store.checkPriceAgreement(
        'product_001',
        100,
        20,
        'piece',
        'customer_002' // Different customer
      );

      expect(result.isCompliant).toBe(true);
      expect(result.message).toBe('No price agreement found');
      expect(result.agreementId).toBeNull();
    });

    it('should handle expired agreements', () => {
      const expiredAgreement = {
        ...mockPriceAgreements[0],
        validTo: new Date('2023-12-31').toISOString(), // Expired
      };
      store.priceAgreements = [expiredAgreement];

      const result = store.checkPriceAgreement(
        'product_001',
        90,
        20,
        'piece',
        'customer_001'
      );

      expect(result.isCompliant).toBe(true);
      expect(result.message).toBe('No active price agreement found');
    });

    it('should handle inactive agreements', () => {
      const inactiveAgreement = {
        ...mockPriceAgreements[0],
        isActive: false,
      };
      store.priceAgreements = [inactiveAgreement];

      const result = store.checkPriceAgreement(
        'product_001',
        90,
        20,
        'piece',
        'customer_001'
      );

      expect(result.isCompliant).toBe(true);
      expect(result.message).toBe('No active price agreement found');
    });
  });

  describe('Unit Conversion Logic', () => {
    it('should correctly convert between units', () => {
      // Test piece to dozen conversion
      expect(store.convertUnit(1, 'piece', 'dozen')).toBe(1/12);
      expect(store.convertUnit(12, 'piece', 'dozen')).toBe(1);
      expect(store.convertUnit(24, 'piece', 'dozen')).toBe(2);

      // Test dozen to piece conversion
      expect(store.convertUnit(1, 'dozen', 'piece')).toBe(12);
      expect(store.convertUnit(2, 'dozen', 'piece')).toBe(24);

      // Test piece to box conversion
      expect(store.convertUnit(24, 'piece', 'box')).toBe(1);
      expect(store.convertUnit(48, 'piece', 'box')).toBe(2);

      // Test box to piece conversion
      expect(store.convertUnit(1, 'box', 'piece')).toBe(24);
      expect(store.convertUnit(2, 'box', 'piece')).toBe(48);
    });

    it('should handle same unit conversion', () => {
      expect(store.convertUnit(10, 'piece', 'piece')).toBe(10);
      expect(store.convertUnit(5, 'dozen', 'dozen')).toBe(5);
    });

    it('should handle invalid unit conversions', () => {
      expect(store.convertUnit(10, 'piece', 'invalid')).toBe(10);
      expect(store.convertUnit(10, 'invalid', 'piece')).toBe(10);
    });
  });

  describe('Price History Logic', () => {
    it('should return customer-specific price history', () => {
      const history = store.getCustomerPriceHistory('product_001', 'customer_001');
      
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      
      // Check that all history entries are for the correct customer
      history.forEach(entry => {
        expect(entry.customerId).toBe('customer_001');
        expect(entry.productId).toBe('product_001');
      });
    });

    it('should return empty array for customer with no history', () => {
      const history = store.getCustomerPriceHistory('product_001', 'customer_999');
      
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });

    it('should return price history sorted by date (most recent first)', () => {
      const history = store.getCustomerPriceHistory('product_001', 'customer_001');
      
      for (let i = 1; i < history.length; i++) {
        const currentDate = new Date(history[i].invoiceDate);
        const previousDate = new Date(history[i-1].invoiceDate);
        expect(currentDate.getTime()).toBeLessThanOrEqual(previousDate.getTime());
      }
    });
  });

  describe('Product Search Logic', () => {
    beforeEach(() => {
      store.products = [
        ...mockProducts,
        {
          id: 'product_002',
          name: 'Another Product',
          sku: 'ANOTHER-001',
          description: 'Another test product',
          baseUnit: 'piece',
          purchasePrice: 75,
          salePrice: 150,
          stockQuantity: 50,
          minStockLevel: 5,
          categoryId: 'category_002',
          brand: 'Another Brand',
          supplier: 'Another Supplier',
          isActive: true,
          units: [],
          variations: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          updatedBy: 'system',
        },
      ];
    });

    it('should search products by name', () => {
      const results = store.searchProducts('Test Product');
      
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Test Product');
    });

    it('should search products by SKU', () => {
      const results = store.searchProducts('TEST-001');
      
      expect(results.length).toBe(1);
      expect(results[0].sku).toBe('TEST-001');
    });

    it('should search products by description', () => {
      const results = store.searchProducts('unit tests');
      
      expect(results.length).toBe(1);
      expect(results[0].description).toContain('unit tests');
    });

    it('should return empty array when no matches found', () => {
      const results = store.searchProducts('Nonexistent Product');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should handle case-insensitive search', () => {
      const resultsLower = store.searchProducts('test product');
      const resultsUpper = store.searchProducts('TEST PRODUCT');
      const resultsMixed = store.searchProducts('TeSt PrOdUcT');
      
      expect(resultsLower.length).toBe(1);
      expect(resultsUpper.length).toBe(1);
      expect(resultsMixed.length).toBe(1);
      expect(resultsLower[0].id).toBe(resultsUpper[0].id);
      expect(resultsUpper[0].id).toBe(resultsMixed[0].id);
    });

    it('should filter by category', () => {
      const results = store.filterProductsByCategory('category_001');
      
      expect(results.length).toBe(1);
      expect(results[0].categoryId).toBe('category_001');
    });

    it('should filter by stock status', () => {
      // In stock products
      let results = store.filterProductsByStockStatus('in_stock');
      expect(results.length).toBeGreaterThan(0);
      results.forEach(product => {
        expect(product.stockQuantity).toBeGreaterThan(product.minStockLevel);
      });

      // Low stock products
      results = store.filterProductsByStockStatus('low_stock');
      results.forEach(product => {
        expect(product.stockQuantity).toBeLessThanOrEqual(product.minStockLevel);
      });

      // Out of stock products
      results = store.filterProductsByStockStatus('out_of_stock');
      results.forEach(product => {
        expect(product.stockQuantity).toBe(0);
      });
    });
  });

  describe('Stock Management Logic', () => {
    it('should correctly identify stock status', () => {
      const productInStock = { ...mockProducts[0], stockQuantity: 50, minStockLevel: 10 };
      const productLowStock = { ...mockProducts[0], stockQuantity: 5, minStockLevel: 10 };
      const productOutOfStock = { ...mockProducts[0], stockQuantity: 0, minStockLevel: 10 };

      expect(store.getStockStatus(productInStock)).toBe('in_stock');
      expect(store.getStockStatus(productLowStock)).toBe('low_stock');
      expect(store.getStockStatus(productOutOfStock)).toBe('out_of_stock');
    });

    it('should calculate total stock value', () => {
      const totalValue = store.calculateTotalStockValue();
      
      expect(totalValue).toBeDefined();
      expect(typeof totalValue).toBe('number');
      expect(totalValue).toBeGreaterThanOrEqual(0);
    });

    it('should get low stock products', () => {
      const lowStockProducts = store.getLowStockProducts();
      
      expect(Array.isArray(lowStockProducts)).toBe(true);
      lowStockProducts.forEach(product => {
        expect(product.stockQuantity).toBeLessThanOrEqual(product.minStockLevel);
      });
    });
  });
});