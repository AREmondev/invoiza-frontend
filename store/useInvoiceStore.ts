import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import {
  Invoice,
  InvoiceLineItem,
  InvoiceSearchFilters,
  AdditionalCharge,
  AppliedAdditionalCharge,
  Payment,
  Return,
  CreateInvoiceDTO,
  CreateInvoiceLineItemDTO,
  Customer,
  PriceAgreement,
  AgreementCheckResult,
} from '@/types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
};

interface InvoiceStore {
  // Current invoice being edited
  currentInvoice: Invoice | null;
  lineItems: InvoiceLineItem[];
  additionalCharges: AppliedAdditionalCharge[];
  payments: Payment[];
  
  // Invoice lists
  salesInvoices: Invoice[];
  purchaseInvoices: Invoice[];
  
  // Search and filters
  searchFilters: InvoiceSearchFilters;
  isLoading: boolean;
  
  // Additional charges configuration
  availableCharges: AdditionalCharge[];
  
  // Price agreements and compliance
  priceAgreements: PriceAgreement[];
  agreementWarnings: AgreementCheckResult[];
  
  // Actions
  setCurrentInvoice: (invoice: Invoice | null) => void;
  setLineItems: (items: InvoiceLineItem[]) => void;
  addLineItem: (item: InvoiceLineItem) => void;
  updateLineItem: (idOrIndex: string | number, updates: Partial<InvoiceLineItem>) => void;
  removeLineItem: (idOrIndex: string | number) => void;
  
  // Additional charges
  setAdditionalCharges: (charges: AppliedAdditionalCharge[]) => void;
  addAdditionalCharge: (charge: AppliedAdditionalCharge) => void;
  removeAdditionalCharge: (index: number) => void;
  
  // Search and filters
  setSearchFilters: (filters: InvoiceSearchFilters) => void;
  setLoading: (loading: boolean) => void;
  
  // Price calculations
  calculateSubtotal: () => number;
  calculateTotal: () => number;
  calculateDueAmount: () => number;
  
  // Agreement checking
  checkAllAgreements: (customerId: string) => AgreementCheckResult[];
  
  // CRUD operations
  createInvoice: (invoiceData: CreateInvoiceDTO) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  
  // Invoice processing
  approveInvoice: (id: string) => Promise<void>;
  cancelInvoice: (id: string) => Promise<void>;
  lockInvoice: (id: string) => Promise<void>;
  
  // Returns
  createReturn: (invoiceId: string, lineItems: CreateInvoiceLineItemDTO[]) => Promise<Return>;
  
  // Missing methods that tests expect
  calculateLineItemTotal: (item: InvoiceLineItem) => InvoiceLineItem;
  clearInvoice: () => void;
  calculateTotals: () => { subtotal: number; total: number; tax: number; discount: number };
  updateAdditionalCharge: (id: string, updates: Partial<AppliedAdditionalCharge>) => void;
  getAgreementWarnings: () => AgreementCheckResult[];
  handlePriceViolationAction: (action: 'force' | 'warn' | 'abort' | 'use-fake-price') => boolean;
}

export const useInvoiceStore = create<InvoiceStore>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        // Initial state
        currentInvoice: null,
        lineItems: [],
        additionalCharges: [],
        payments: [],
        salesInvoices: [],
        purchaseInvoices: [],
        searchFilters: {},
        isLoading: false,
        availableCharges: [],
        priceAgreements: [],
        agreementWarnings: [],

        // Actions
        setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),
        
        setLineItems: (items) => set((state) => ({
          lineItems: items,
          currentInvoice: state.currentInvoice ? { ...state.currentInvoice, lineItems: items } : state.currentInvoice
        })),
        
        addLineItem: (item) => set((state) => {
          const newLineItems = [...state.lineItems, item];
          return {
            lineItems: newLineItems,
            currentInvoice: state.currentInvoice ? { ...state.currentInvoice, lineItems: newLineItems } : state.currentInvoice
          };
        }),
        
        updateLineItem: (idOrIndex, updates) => set((state) => {
          let newLineItems;
          
          if (typeof idOrIndex === 'string') {
            // Find by ID
            newLineItems = state.lineItems.map(item => 
              item.id === idOrIndex ? { ...item, ...updates } : item
            );
          } else {
            // Find by index
            newLineItems = state.lineItems.map((item, i) => 
              i === idOrIndex ? { ...item, ...updates } : item
            );
          }
          
          return {
            lineItems: newLineItems,
            currentInvoice: state.currentInvoice ? { ...state.currentInvoice, lineItems: newLineItems } : state.currentInvoice
          };
        }),
        
        removeLineItem: (idOrIndex) => set((state) => {
          let newLineItems;
          
          if (typeof idOrIndex === 'string') {
            // Remove by ID
            newLineItems = state.lineItems.filter(item => item.id !== idOrIndex);
          } else {
            // Remove by index
            newLineItems = state.lineItems.filter((_, i) => i !== idOrIndex);
          }
          
          return {
            lineItems: newLineItems,
            currentInvoice: state.currentInvoice ? { ...state.currentInvoice, lineItems: newLineItems } : state.currentInvoice
          };
        }),

        setAdditionalCharges: (charges) => set((state) => ({
          additionalCharges: charges,
          currentInvoice: state.currentInvoice ? { ...state.currentInvoice, additionalCharges: charges } : state.currentInvoice
        })),
        
        addAdditionalCharge: (charge) => set((state) => {
          const newAdditionalCharges = [...state.additionalCharges, charge];
          return {
            additionalCharges: newAdditionalCharges,
            currentInvoice: state.currentInvoice ? { ...state.currentInvoice, additionalCharges: newAdditionalCharges } : state.currentInvoice
          };
        }),
        
        removeAdditionalCharge: (index) => set((state) => {
          const newAdditionalCharges = state.additionalCharges.filter((_, i) => i !== index);
          return {
            additionalCharges: newAdditionalCharges,
            currentInvoice: state.currentInvoice ? { ...state.currentInvoice, additionalCharges: newAdditionalCharges } : state.currentInvoice
          };
        }),

        setSearchFilters: (filters) => set({ searchFilters: filters }),
        
        setLoading: (loading) => set({ isLoading: loading }),

        // Price calculations
        calculateSubtotal: () => {
          const { lineItems } = get();
          return lineItems.reduce((sum, item) => sum + item.totalPriceCents, 0);
        },

        calculateTotal: () => {
          const { lineItems, additionalCharges, currentInvoice } = get();
          const subtotal = get().calculateSubtotal();
          const totalAdditionalCharges = additionalCharges.reduce((sum, charge) => sum + charge.amountCents, 0);
          
          let total = subtotal + totalAdditionalCharges;
          
          // Apply invoice-level discount
          if (currentInvoice) {
            if (currentInvoice.discountType === 'percentage') {
              total = total * (1 - currentInvoice.discountValue / 100);
            } else {
              total = total - currentInvoice.discountValue;
            }
          }
          
          return Math.max(0, total);
        },

        calculateDueAmount: () => {
          const { payments } = get();
          const total = get().calculateTotal();
          const totalPaid = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
          return Math.max(0, total - totalPaid);
        },

        checkAllAgreements: (customerId) => {
          const { lineItems, priceAgreements } = get();
          const warnings: AgreementCheckResult[] = [];
          
          lineItems.forEach(item => {
            const agreement = priceAgreements.find(
              ag => ag.customerId === customerId && 
                   ag.productId === item.productId && 
                   ag.unit === item.unit && 
                   ag.isActive
            );
            
            if (agreement && item.unitPriceCents < agreement.minUnitPriceCents) {
              warnings.push({
                isCompliant: false,
                message: `Price below minimum agreement: ${formatCurrency(item.unitPriceCents)} < ${formatCurrency(agreement.minUnitPriceCents)}`,
                agreementId: agreement.id,
                hasAgreement: true,
                agreement,
                isBelowMinimum: true,
                minimumPriceCents: agreement.minUnitPriceCents,
                enteredPriceCents: item.unitPriceCents,
                fakePriceRule: undefined,
                shouldUseFakePrice: false,
              });
            }
          });
          
          set({ agreementWarnings: warnings });
          return warnings;
        },

        // CRUD operations (placeholders for Convex)
        createInvoice: async (invoiceData) => {
          console.log('Creating invoice:', invoiceData);
          // This will be connected to Convex
          return {} as Invoice;
        },

        updateInvoice: async (id, updates) => {
          console.log('Updating invoice:', id, updates);
        },

        deleteInvoice: async (id) => {
          console.log('Deleting invoice:', id);
        },

        approveInvoice: async (id) => {
          console.log('Approving invoice:', id);
        },

        cancelInvoice: async (id) => {
          console.log('Cancelling invoice:', id);
        },

        lockInvoice: async (id) => {
          console.log('Locking invoice:', id);
        },

        createReturn: async (invoiceId, lineItems) => {
          console.log('Creating return:', invoiceId, lineItems);
          return {} as Return;
        },

        // Missing methods implementation
        calculateLineItemTotal: (item) => {
          let total = item.quantity * item.unitPriceCents;
          
          // Apply additional charges (already calculated and stored in cents)
          total += item.additionalChargesCents;
          
          return {
            ...item,
            totalPriceCents: Math.round(total)
          };
        },

        clearInvoice: () => {
          set({
            currentInvoice: {
              id: '',
              invoiceNumber: '',
              customerId: '',
              supplierId: '',
              billingName: '',
              type: 'sale',
              status: 'draft',
              paymentStatus: 'pending',
              paymentMethod: '',
              invoiceDate: new Date(),
              subtotalCents: 0,
              discountCents: 0,
              discountType: 'percentage',
              discountValue: 0,
              additionalChargesCents: 0,
              taxCents: 0,
              totalCents: 0,
              paidCents: 0,
              dueCents: 0,
              notes: '',
              terms: '',
              isLocked: false,
              lineItems: [],
              additionalCharges: [],
              payments: [],
              returns: [],
              auditLogs: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: '',
              updatedBy: '',
            },
            lineItems: [],
            additionalCharges: [],
            payments: [],
            agreementWarnings: []
          });
        },

        calculateTotals: () => {
          const { lineItems, additionalCharges, currentInvoice } = get();
          
          // Use current invoice line items if available, otherwise use separate lineItems array
          const itemsToCalculate = currentInvoice?.lineItems || lineItems;
          
          // Calculate subtotal from line items
          const subtotal = itemsToCalculate.reduce((sum, item) => sum + (item.quantity * (item.unitPriceCents / 100)), 0);
          
          // Calculate totals for additional charges
          let tax = 0;
          let discount = 0;
          let otherCharges = 0;
          
          additionalCharges.forEach(charge => {
            
            if (charge.type === 'percentage') {
              const chargeAmount = (subtotal * charge.value) / 100;
              if (charge.name.toLowerCase().includes('tax')) {
                tax += chargeAmount;
              } else if (charge.value < 0 || charge.name.toLowerCase().includes('discount')) {
                discount += chargeAmount;
              } else {
                otherCharges += chargeAmount;
              }
            } else if (charge.type === 'fixed') {
              if (charge.name.toLowerCase().includes('tax')) {
                tax += charge.value;
              } else if (charge.value < 0 || charge.name.toLowerCase().includes('discount')) {
                discount += charge.value;
              } else {
                otherCharges += charge.value;
              }
            }
          });
          
          const total = subtotal + tax + discount + otherCharges;
          
          return {
            subtotal: Math.round(subtotal * 100) / 100,
            total: Math.round(total * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            discount: Math.round(discount * 100) / 100,
          };
        },

        updateAdditionalCharge: (id, updates) => {
          set((state) => ({
            additionalCharges: state.additionalCharges.map(charge =>
              charge.id === id ? { ...charge, ...updates } : charge
            )
          }));
        },

        getAgreementWarnings: () => {
          const { agreementWarnings } = get();
          return agreementWarnings;
        },

        handlePriceViolationAction: (action) => {
          // Return true for allowed actions, false for blocked actions
          return action !== 'abort';
        },
      })
    ),
    {
      name: 'invoice-store',
      partialize: (state: any) => ({
        // Only persist UI state, not data
        searchFilters: state.searchFilters,
        currentInvoice: state.currentInvoice,
      }),
    }
  )
);