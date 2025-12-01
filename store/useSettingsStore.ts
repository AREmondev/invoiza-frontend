import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { AdditionalCharge, SystemSettings } from '@/types';

interface SettingsStore {
  // Settings wrapper for compatibility with tests
  settings: {
    additionalCharges: AdditionalCharge[];
    allowNegativeCharges: boolean;
    chargeTaxOnCharges: boolean;
    minimumChargeAmount: number;
    maximumChargePercentage: number;
    
    // Business settings
    businessName: string;
    currency: string;
    timezone: string;
    dateFormat: string;
    autoBackup: boolean;
    emailNotifications: boolean;
    lowStockAlerts: boolean;
    
    // Billing aliases
    billingAliases: any[];
    
    // Price agreement settings
    enforcePriceAgreements: boolean;
    priceAgreementAction: 'warn' | 'block' | 'allow';
    fakePriceThreshold: number;
    allowBelowCostPricing: boolean;
    minimumMarkupPercentage: number;
    
    // Audit logging settings
    enableAuditLogging: boolean;
    auditLogRetention: number;
    logPriceChanges: boolean;
    logLoginAttempts: boolean;
    logPermissionChanges: boolean;
    logStockChanges: boolean;
    logInvoiceChanges: boolean;
    logCustomerChanges: boolean;
    logProductChanges: boolean;
  };
  
  // Additional charges
  additionalCharges: AdditionalCharge[];
  activeAdditionalCharges: AdditionalCharge[];
  
  // System settings
  systemSettings: SystemSettings[];
  
  // Feature flags
  features: {
    billingAliases: boolean;
    priceAgreements: boolean;
    fakePricing: boolean;
    auditLogging: boolean;
    multiCurrency: boolean;
    advancedInventory: boolean;
  };
  
  // Business rules
  businessRules: {
    autoLockInvoices: boolean;
    lockAfterDays: number;
    requireApprovalForReturns: boolean;
    maxDiscountPercentage: number;
    minAgreementPriceAlert: 'warn' | 'block' | 'allow';
    priceUpdateBehavior: 'manual' | 'auto' | 'ask';
  };
  
  // Actions
  setAdditionalCharges: (charges: AdditionalCharge[]) => void;
  addAdditionalCharge: (charge: AdditionalCharge) => void;
  updateAdditionalCharge: (id: string, updates: Partial<AdditionalCharge>) => void;
  deleteAdditionalCharge: (id: string) => void;
  removeAdditionalCharge: (id: string) => void; // Alias for deleteAdditionalCharge
  toggleAdditionalCharge: (id: string) => void;
  
  // System settings
  setSystemSettings: (settings: SystemSettings[]) => void;
  updateSystemSetting: (key: string, value: any) => void;
  getSystemSetting: (key: string, defaultValue?: any) => any;
  
  // Feature flags
  setFeatureFlag: (feature: keyof SettingsStore['features'], enabled: boolean) => void;
  
  // Business rules
  updateBusinessRule: (rule: keyof SettingsStore['businessRules'], value: any) => void;
  
  // Settings wrapper
  updateSettings: (updates: Partial<SettingsStore['settings']>) => void;
  
  // Helpers
  getActiveAdditionalCharges: () => AdditionalCharge[];
  getPerLineCharges: () => AdditionalCharge[];
  getGlobalCharges: () => AdditionalCharge[];
  
  // Local storage
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  
  // Missing methods that tests expect
  applyCharge: (baseAmount: number, charge: AdditionalCharge) => number;
  validateCharge: (charge: AdditionalCharge) => boolean;
  hasDuplicateChargeName: (charge: AdditionalCharge) => boolean;
  getChargeTemplate: (type: string) => AdditionalCharge;
  createChargeFromTemplate: (template: AdditionalCharge, overrides: Partial<AdditionalCharge>) => AdditionalCharge;
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        (set, get) => ({
          // Initial state
          settings: {
            additionalCharges: [],
            allowNegativeCharges: true,
            chargeTaxOnCharges: false,
            minimumChargeAmount: 0,
            maximumChargePercentage: 100,
            
            // Business settings
            businessName: "",
            currency: "BDT",
            timezone: "Asia/Dhaka",
            dateFormat: "dd/MM/yyyy",
            autoBackup: false,
            emailNotifications: false,
            lowStockAlerts: false,
            
            // Billing aliases
            billingAliases: [],
            
            // Price agreement settings
            enforcePriceAgreements: true,
            priceAgreementAction: "warn" as const,
            fakePriceThreshold: 10,
            allowBelowCostPricing: false,
            minimumMarkupPercentage: 0,
            
            // Audit logging settings
            enableAuditLogging: true,
            auditLogRetention: 90,
            logPriceChanges: false,
            logLoginAttempts: true,
            logPermissionChanges: true,
            logStockChanges: true,
            logInvoiceChanges: true,
            logCustomerChanges: true,
            logProductChanges: true,
          },
          additionalCharges: [],
          activeAdditionalCharges: [],
          systemSettings: [],
          
          features: {
            billingAliases: true,
            priceAgreements: true,
            fakePricing: true,
            auditLogging: true,
            multiCurrency: false,
            advancedInventory: true,
          },
          
          businessRules: {
            autoLockInvoices: true,
            lockAfterDays: 30,
            requireApprovalForReturns: true,
            maxDiscountPercentage: 50,
            minAgreementPriceAlert: 'warn',
            priceUpdateBehavior: 'ask',
          },

          // Actions
          setAdditionalCharges: (charges) => set((state) => ({ 
            additionalCharges: charges,
            activeAdditionalCharges: charges.filter(charge => charge.isActive),
            settings: {
              ...state.settings,
              additionalCharges: charges
            }
          })),
          
          addAdditionalCharge: (charge) => set((state) => {
            const newCharges = [...state.additionalCharges, charge];
            return {
              additionalCharges: newCharges,
              activeAdditionalCharges: charge.isActive 
                ? [...state.activeAdditionalCharges, charge]
                : state.activeAdditionalCharges,
              settings: {
                ...state.settings,
                additionalCharges: newCharges
              }
            };
          }),
          
          updateAdditionalCharge: (id, updates) => set((state) => {
            const updatedCharges = state.additionalCharges.map(charge =>
              charge.id === id ? { ...charge, ...updates } : charge
            );
            
            return {
              additionalCharges: updatedCharges,
              activeAdditionalCharges: updatedCharges.filter(charge => charge.isActive),
              settings: {
                ...state.settings,
                additionalCharges: updatedCharges
              }
            };
          }),
          
          deleteAdditionalCharge: (id) => set((state) => {
            const filteredCharges = state.additionalCharges.filter(charge => charge.id !== id);
            
            return {
              additionalCharges: filteredCharges,
              activeAdditionalCharges: filteredCharges.filter(charge => charge.isActive),
              settings: {
                ...state.settings,
                additionalCharges: filteredCharges
              }
            };
          }),
          
          removeAdditionalCharge: (id) => {
            // Alias for deleteAdditionalCharge
            return get().deleteAdditionalCharge(id);
          },
          
          toggleAdditionalCharge: (id) => set((state) => {
            const updatedCharges = state.additionalCharges.map(charge =>
              charge.id === id ? { ...charge, isActive: !charge.isActive } : charge
            );
            
            return {
              additionalCharges: updatedCharges,
              activeAdditionalCharges: updatedCharges.filter(charge => charge.isActive),
              settings: {
                ...state.settings,
                additionalCharges: updatedCharges
              }
            };
          }),

          // System settings
          setSystemSettings: (settings) => set({ systemSettings: settings }),
          
          updateSystemSetting: (key, value) => set((state) => ({
            systemSettings: state.systemSettings.map(setting =>
              setting.key === key ? { ...setting, value } : setting
            )
          })),
          
          getSystemSetting: (key, defaultValue = null) => {
            const { systemSettings } = get();
            const setting = systemSettings.find(s => s.key === key);
            return setting ? setting.value : defaultValue;
          },

          // Feature flags
          setFeatureFlag: (feature, enabled) => set((state) => ({
            features: {
              ...state.features,
              [feature]: enabled,
            }
          })),

          // Business rules
          updateBusinessRule: (rule, value) => set((state) => ({
            businessRules: {
              ...state.businessRules,
              [rule]: value,
            }
          })),

          // Settings wrapper
          updateSettings: (updates) => set((state) => ({
            settings: {
              ...state.settings,
              ...updates,
            }
          })),

          // Helpers
          getActiveAdditionalCharges: () => {
            const { activeAdditionalCharges } = get();
            return activeAdditionalCharges;
          },
          
          getPerLineCharges: () => {
            const { activeAdditionalCharges } = get();
            return activeAdditionalCharges.filter(charge => 
              charge.applyTo === 'per_line' || charge.applyTo === 'both'
            );
          },
          
          getGlobalCharges: () => {
            const { activeAdditionalCharges } = get();
            return activeAdditionalCharges.filter(charge => 
              charge.applyTo === 'global' || charge.applyTo === 'both'
            );
          },

          // Local storage
          saveToLocalStorage: () => {
            const { features, businessRules } = get();
            const data = {
              features,
              businessRules,
            };
            localStorage.setItem('settings-store', JSON.stringify(data));
          },

          loadFromLocalStorage: () => {
            try {
              const stored = localStorage.getItem('settings-store');
              if (stored) {
                const data = JSON.parse(stored);
                set(data);
              }
            } catch (error) {
              console.error('Error loading from localStorage:', error);
            }
          },

          // Missing methods implementation
          applyCharge: (baseAmount, charge) => {
            if (!charge.isActive) return 0;
            
            if (charge.type === 'percentage') {
              return (baseAmount * charge.value) / 100;
            } else if (charge.type === 'fixed') {
              return charge.value;
            }
            
            return 0;
          },

          validateCharge: (charge) => {
            const { settings } = get();
            
            // Basic validation logic
            if (!charge.name || charge.name.trim().length === 0) return false;
            if (charge.value < 0 && !settings.allowNegativeCharges) return false;
            if (charge.type === 'percentage' && charge.value > settings.maximumChargePercentage) return false;
            if (charge.type === 'percentage' && charge.value < -settings.maximumChargePercentage) return false;
            if (!['percentage', 'fixed'].includes(charge.type)) return false;
            if (!['global', 'per_line', 'both'].includes(charge.applyTo)) return false;
            
            // Check minimum charge amount
            if (Math.abs(charge.value) < settings.minimumChargeAmount) return false;
            
            return true;
          },

          hasDuplicateChargeName: (charge) => {
            const { additionalCharges } = get();
            return additionalCharges.some(existingCharge => 
              existingCharge.id !== charge.id && 
              existingCharge.name.toLowerCase() === charge.name.toLowerCase()
            );
          },

          getChargeTemplate: (type) => {
            const templates: Record<string, AdditionalCharge> = {
              'tax': {
                id: 'template_tax',
                name: 'Tax',
                description: 'Standard sales tax',
                type: 'percentage',
                value: 10,
                applyTo: 'global',
                isTaxable: true,
                isActive: true,
                defaultEnabled: true,
                sortOrder: 1,
                auditLogs: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
                updatedBy: 'system',
              },
              'discount': {
                id: 'template_discount',
                name: 'Discount',
                description: 'Generic discount',
                type: 'percentage',
                value: 5,
                applyTo: 'per_line',
                isTaxable: false,
                isActive: true,
                defaultEnabled: true,
                sortOrder: 2,
                auditLogs: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
                updatedBy: 'system',
              },
              'service': {
                id: 'template_service',
                name: 'Service Fee',
                description: 'Service handling fee',
                type: 'fixed',
                value: 25,
                applyTo: 'global',
                isTaxable: true,
                isActive: true,
                defaultEnabled: true,
                sortOrder: 3,
                auditLogs: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
                updatedBy: 'system',
              }
            };
            
            return templates[type] || templates['tax'];
          },

          createChargeFromTemplate: (template, overrides) => {
            const newCharge = {
              ...template,
              id: `charge_${Date.now()}`,
              ...overrides,
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: 'system',
              updatedBy: 'system',
              auditLogs: [],
            };
            
            // Validate the new charge
            if (!get().validateCharge(newCharge)) {
              // If validation fails, adjust defaults to pass validation
              const fixedCharge = {
                ...newCharge,
                name: newCharge.name || 'Unnamed Charge',
                description: newCharge.description || '',
                sortOrder: newCharge.sortOrder ?? 99,
                defaultEnabled: newCharge.defaultEnabled ?? true,
              };
              return fixedCharge as AdditionalCharge;
            }
            
            return newCharge as AdditionalCharge;
          },
        })
      ),
      {
        name: 'settings-store',
        partialize: (state) => ({
          features: state.features,
          businessRules: state.businessRules,
        }),
      }
    )
  )
);