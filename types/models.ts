// Core Base Types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface AuditableEntity extends BaseEntity {
  auditLogs: AuditLog[];
}

// User and Authentication
export interface User extends BaseEntity {
  email: string;
  name: string;
  roleId: string;
  isActive: boolean;
  lastLoginAt?: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  tableColumns: Record<string, string[]>; // tableId -> visibleColumns
  lastUsedPaymentMethod: string;
  dateFormat: string;
  currency: string;
  timezone: string;
}

// Role and Permissions
export interface Role extends BaseEntity {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

export interface Permission {
  module: ModuleType;
  actions: ActionType[];
  itemLevelPermissions?: ItemLevelPermission[];
}

export interface PermissionDefinition extends Permission, BaseEntity {
  name: string;
  displayName: string;
  category: string;
  description: string;
}

export type ModuleType =
  | "products"
  | "customers"
  | "purchases"
  | "sales"
  | "returns"
  | "payments"
  | "settings"
  | "reports"
  | "audit";

export type ActionType = "create" | "read" | "update" | "delete" | "approve";

export interface ItemLevelPermission {
  itemId: string;
  itemType: string;
  actions: ActionType[];
}

// Godown/Room for inventory tracking
export interface Godown extends BaseEntity {
  name: string;
  code?: string;
  location?: string;
  description?: string;
  isActive: boolean;
}

// Product and Inventory
export interface Product extends AuditableEntity {
  name: string; // Required: Item Name
  description?: string;
  sku: string;
  barcode?: string;
  categoryId?: string; // Optional
  brand?: string; // Optional
  baseUnit: string;
  trackInventory: boolean;
  minStockLevel: number;
  maxStockLevel: number;
  stockQuantity: number; // Required: Stock Quantity
  stockValue: number; // Required: Stock Value (calculated)
  salePrice: number; // Required: Sale Price (in cents)
  purchasePrice: number; // Required: Purchase Price (in cents)
  godowns: ProductGodownStock[]; // Required: Track which godowns/rooms have this product
  isActive: boolean;
  variations: ProductVariation[];
  units: ProductUnit[];
  images: string[];
  metadata: Record<string, any>;
}

// Stock tracking per godown/room
export interface ProductGodownStock extends BaseEntity {
  productId: string;
  godownId: string;
  quantity: number;
  unit: string;
  value: number; // Stock value for this godown
}

export interface ProductVariation extends BaseEntity {
  productId: string;
  name: string;
  sku: string;
  attributes: Record<string, string>; // e.g., { color: "red", size: "large" }
  barcode?: string;
  isActive: boolean;
}

export interface ProductUnit extends BaseEntity {
  productId: string;
  unit: string;
  conversionFactor: number; // e.g., 1 box = 12 pcs
  isBaseUnit: boolean;
  price: number; // price per this unit
  cost: number; // cost per this unit
  barcode?: string;
  isActive: boolean;
}

export interface UnitConversion extends BaseEntity {
  fromUnit: string;
  toUnit: string;
  fromProductId: string;
  toProductId?: string; // optional for cross-product conversions
  conversionFactor: number;
  isActive: boolean;
}

// Commission Agent (Referral System)
export interface CommissionAgent extends AuditableEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  commissionType: "profit" | "account" | "fixed";
  commissionValue: number; // percentage for profit/account, fixed amount for fixed
  isActive: boolean;
  notes?: string;
}

// Customer and Party
export interface Customer extends AuditableEntity {
  name: string; // Required
  email?: string;
  phone?: string;
  address?: Address;
  type: "individual" | "business";
  creditLimit: number; // Required
  paymentTerms: number; // days
  receivableBalance: number; // Required: Receivable Balance (in cents)
  payableBalance: number; // Required: Payable Balance (in cents)
  commissionAgentId?: string; // Optional: Commission agent for this customer
  isActive: boolean;
  billingAliases: BillingAlias[];
  agreements: PriceAgreement[];
  taxNumber?: string;
  notes?: string;
}

export interface BillingAlias extends BaseEntity {
  customerId: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Price Agreements and Fake Pricing
export interface PriceAgreement extends BaseEntity {
  customerId: string;
  productId: string;
  variationId?: string;
  unit: string;
  minUnitPriceCents: number;
  maxUnitPriceCents?: number;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

export interface FakePriceRule extends BaseEntity {
  name: string;
  description: string;
  customerId: string;
  productId: string;
  variationId?: string;
  unit: string;
  fakeUnitPriceCents: number;
  realUnitPriceCents: number;
  isActive: boolean;
  conditions: Record<string, any>;
}

// Additional Charges
export interface AdditionalCharge extends AuditableEntity {
  name: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  applyTo: "per_line" | "global" | "both";
  isTaxable: boolean;
  isActive: boolean;
  defaultEnabled: boolean;
  sortOrder: number;
}

// Invoice Base (common for Sales and Purchases)
export interface Invoice extends AuditableEntity {
  invoiceNumber: string;
  type: "sale" | "purchase";
  customerId?: string;
  supplierId?: string;
  billingName?: string;
  billingAddress?: Address;
  invoiceDate: Date;
  dueDate?: Date;
  subtotalCents: number;
  discountCents: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  additionalChargesCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  dueCents: number;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  commissionAgentId?: string; // Commission agent for this invoice
  commissionAmountCents?: number; // Calculated commission amount
  notes?: string;
  terms?: string;
  lineItems: InvoiceLineItem[];
  additionalCharges: AppliedAdditionalCharge[];
  payments: Payment[];
  returns: Return[];
  isLocked: boolean;
  lockedAt?: Date;
  lockedBy?: string;
}

export type InvoiceStatus =
  | "draft"
  | "pending"
  | "approved"
  | "paid"
  | "overdue"
  | "cancelled";
export type PaymentStatus =
  | "pending"
  | "partial"
  | "paid"
  | "overpaid"
  | "refunded";

export interface InvoiceLineItem extends BaseEntity {
  invoiceId: string;
  productId: string;
  variationId?: string;
  unit: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  discountCents: number;
  additionalChargesCents: number;
  costCents?: number;
  profitCents?: number;
  godownId?: string; // Which godown/room this item is from
  notes?: string;
  isReturned: boolean;
  returnedQuantity: number;
  agreementPriceCents?: number; // for fake pricing compliance
  originalPriceCents: number; // price entered by user
}

export interface AppliedAdditionalCharge extends BaseEntity {
  invoiceId: string;
  additionalChargeId: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  applyTo: "per_line" | "global";
  amountCents: number;
  isTaxable: boolean;
  lineItemIds?: string[]; // for per-line charges
}

// Payments
export interface Payment extends BaseEntity {
  invoiceId: string;
  amountCents: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  paymentDate: Date;
  status: PaymentStatus;
  processedBy: string;
}

// Returns
export interface Return extends AuditableEntity {
  returnNumber: string;
  invoiceId: string;
  type: "sale_return" | "purchase_return";
  returnDate: Date;
  reason: string;
  status: ReturnStatus;
  subtotalCents: number;
  totalCents: number;
  lineItems: ReturnLineItem[];
  refundPayment?: Payment;
}

export type ReturnStatus = "pending" | "approved" | "processed" | "cancelled";

export interface ReturnLineItem extends BaseEntity {
  returnId: string;
  originalInvoiceLineItemId: string;
  productId: string;
  variationId?: string;
  unit: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  reason: string;
  isApproved: boolean;
}

// Audit and History
export interface AuditLog extends BaseEntity {
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId: string;
  userName: string;
  changes: AuditChange[];
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "cancel"
  | "lock"
  | "unlock"
  | "return"
  | "payment";

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  dataType: string;
}

// Stock and Inventory
export interface StockMovement extends BaseEntity {
  productId: string;
  variationId?: string;
  unit: string;
  movementType: StockMovementType;
  quantity: number;
  unitCostCents?: number;
  totalCostCents?: number;
  referenceId?: string; // invoiceId, returnId, etc.
  referenceType?: string;
  notes?: string;
  balanceAfter: number;
}

export type StockMovementType =
  | "sale"
  | "purchase"
  | "return_in"
  | "return_out"
  | "adjustment"
  | "transfer_in"
  | "transfer_out";

// Settings
export interface SystemSettings extends BaseEntity {
  key: string;
  value: any;
  dataType: "string" | "number" | "boolean" | "object" | "array";
  category: string;
  description?: string;
  isUserConfigurable: boolean;
}

// Reports and Analytics
export interface SalesReport {
  dateRange: DateRange;
  totalSalesCents: number;
  totalProfitCents: number;
  totalItemsSold: number;
  averageOrderValueCents: number;
  topProducts: ProductSalesSummary[];
  topCustomers: CustomerSalesSummary[];
  paymentMethodBreakdown: Record<string, number>;
}

export interface ProductSalesSummary {
  productId: string;
  productName: string;
  totalQuantitySold: number;
  totalSalesCents: number;
  totalProfitCents: number;
  averageUnitPriceCents: number;
}

export interface CustomerSalesSummary {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalSalesCents: number;
  averageOrderValueCents: number;
  lastOrderDate?: Date;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// DTOs for API requests/responses
export interface CreateProductDTO {
  name: string; // Required
  description?: string;
  sku: string;
  barcode?: string;
  categoryId?: string; // Optional
  brand?: string; // Optional
  baseUnit: string;
  trackInventory: boolean;
  minStockLevel: number;
  maxStockLevel: number;
  salePrice: number; // Required: Sale Price (in cents)
  purchasePrice: number; // Required: Purchase Price (in cents)
  godowns: CreateProductGodownStockDTO[]; // Required: Godown/room assignments
  variations: CreateProductVariationDTO[];
  units: CreateProductUnitDTO[];
  images: string[];
}

export interface CreateProductGodownStockDTO {
  godownId: string;
  quantity: number;
  unit: string;
}

export interface CreateProductVariationDTO {
  name: string;
  sku: string;
  attributes: Record<string, string>;
  barcode?: string;
}

export interface CreateProductUnitDTO {
  unit: string;
  conversionFactor: number;
  isBaseUnit: boolean;
  price: number;
  cost: number;
  barcode?: string;
}

export interface CreateInvoiceDTO {
  type: "sale" | "purchase";
  customerId?: string;
  supplierId?: string;
  billingName?: string;
  billingAddress?: Address;
  invoiceDate: Date;
  dueDate?: Date;
  discountCents: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  commissionAgentId?: string; // Commission agent for this invoice
  notes?: string;
  terms?: string;
  lineItems: CreateInvoiceLineItemDTO[];
  additionalCharges: CreateAppliedAdditionalChargeDTO[];
}

export interface CreateInvoiceLineItemDTO {
  productId: string;
  variationId?: string;
  unit: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  godownId?: string; // Which godown/room this item is from
  notes?: string;
}

export interface CreateAppliedAdditionalChargeDTO {
  additionalChargeId: string;
  lineItemIds?: string[];
}

export interface CreateReturnDTO {
  invoiceId: string;
  type: "sale_return" | "purchase_return";
  reason: string;
  lineItems: CreateReturnLineItemDTO[];
}

export interface CreateReturnLineItemDTO {
  originalInvoiceLineItemId: string;
  quantity: number;
  reason: string;
}

export interface CreatePaymentDTO {
  invoiceId: string;
  amountCents: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  paymentDate: Date;
}

// Search and Filter Types
export interface ProductSearchFilters {
  query?: string;
  categoryId?: string;
  brand?: string;
  inStock?: boolean;
  priceRange?: NumberRange;
  sortBy?: "name" | "price" | "stock" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface NumberRange {
  min?: number;
  max?: number;
}

export interface InvoiceSearchFilters {
  query?: string;
  customerId?: string;
  status?: InvoiceStatus[];
  paymentStatus?: PaymentStatus[];
  dateRange?: DateRange;
  totalRange?: NumberRange;
  sortBy?: "date" | "total" | "customer" | "status";
  sortOrder?: "asc" | "desc";
}

// UI State Types
export interface TableColumnPreferences {
  visible: boolean;
  width?: number;
  order: number;
}

export interface ProductSelectorState {
  searchQuery: string;
  selectedCategory?: string;
  selectedProduct?: Product;
  selectedVariation?: ProductVariation;
  selectedUnit?: ProductUnit;
  showDetails: boolean;
}

export interface PriceHistoryEntry {
  invoiceId: string;
  invoiceDate: Date;
  customerId: string;
  customerName: string;
  productId?: string;
  variationId?: string;
  unitPriceCents: number;
  quantity: number;
  unit: string;
}

export interface AgreementCheckResult {
  isCompliant: boolean;
  message: string;
  agreementId: string | null;
  hasAgreement?: boolean;
  agreement?: PriceAgreement;
  isBelowMinimum?: boolean;
  minimumPriceCents?: number;
  enteredPriceCents?: number;
  fakePriceRule?: FakePriceRule;
  shouldUseFakePrice?: boolean;
  fakePriceCents?: number;
}