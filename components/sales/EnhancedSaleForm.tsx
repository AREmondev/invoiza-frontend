"use client";

import { useState, useEffect, useMemo } from 'react';
import { Plus, Save, Eye, Trash2, Calculator, DollarSign, User, Calendar, Package, AlertCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Import our custom components
import { ProductSelector, LineEditor, ChargesSelector, PaymentModule, CustomerDetailsModal, ProductDetailsOffcanvas } from '@/components/shared';
import { CommissionAgentSelector } from '@/components/shared/CommissionAgentSelector';
import { useSaleStore } from '@/store/useSaleStore';
import { useProductStore } from '@/store/useProductStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { useUserStore } from '@/store/useUserStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from 'convex/react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/convex';

// Import types
import { InvoiceLineItem, AppliedAdditionalCharge, CreateInvoiceDTO, Customer, Product } from '@/types';

interface EnhancedSaleFormProps {
  tabId: string;
  initialCustomerName?: string;
}

// Form validation schema
const saleFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  billingName: z.string().optional(), // Simple string input for billing name
  invoiceDate: z.date(),
  dueDate: z.date().optional(),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentAmount: z.coerce.number().int().min(0).optional(), // Payment amount as whole number (will be converted to cents)
  paymentStatus: z.enum(['pending', 'partial', 'paid', 'overpaid']),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0).max(100),
  commissionAgentId: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

export function EnhancedSaleForm({ tabId, initialCustomerName = '' }: EnhancedSaleFormProps) {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<AppliedAdditionalCharge[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreementWarnings, setAgreementWarnings] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCommissionAgentId, setSelectedCommissionAgentId] = useState<string | undefined>();
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);
  const [showProductDetailsOffcanvas, setShowProductDetailsOffcanvas] = useState(false);

  // Store hooks
  const { saleTabs, updateCustomerName, updateBillingName, updateDiscount, updateTotal } = useSaleStore();
  const { products, setProducts } = useProductStore();
  const { calculateSubtotal, calculateTotal, calculateDueAmount } = useInvoiceStore();
  const { currentUser, preferences } = useUserStore();
  const { features, businessRules } = useSettingsStore();
  const { toast } = useToast();
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  // Load products from Convex
  const convexProducts = useQuery(
    api.queries.products.getProducts,
    userEmail ? { userEmail } : "skip"
  );

  // Load customers from Convex
  const convexCustomers = useQuery(
    api.queries.customers.getCustomers,
    userEmail ? { userEmail } : "skip"
  ) || [];

  // Convert Convex customers to Customer type - memoized to prevent re-renders
  const customers: Customer[] = useMemo(() => {
    return (convexCustomers || []).map((c: any) => ({
      id: c._id,
      name: c.name,
      type: (c.type || 'individual') as 'individual' | 'business',
      email: c.email,
      phone: c.phone || c.mobile,
      creditLimit: c.metadata?.creditLimit || 0,
      paymentTerms: c.metadata?.paymentTerms || 30,
      receivableBalance: 0,
      payableBalance: 0,
      isActive: c.isActive !== false,
      billingAliases: (c.billingAliases || []).map((alias: string, idx: number) => ({
        id: `alias-${idx}`,
        customerId: c._id,
        name: alias,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      })),
      agreements: [],
      auditLogs: [],
      createdAt: new Date(c.createdAt || Date.now()),
      updatedAt: new Date(c.updatedAt || Date.now()),
      createdBy: c.createdBy || 'system',
      updatedBy: c.updatedBy || 'system',
    }));
  }, [convexCustomers]);

  // Update products in store when Convex products load
  useEffect(() => {
    if (convexProducts && convexProducts.length > 0) {
      // Convert Convex products to Product type
      const convertedProducts = convexProducts.map((p: any) => ({
        id: p._id,
        name: p.name,
        description: p.description,
        sku: p.sku,
        barcode: p.barcode,
        brandId: p.brandId,
        categoryId: p.categoryId,
        baseUnit: p.baseUnit?.abbreviation || 'piece',
        salePrice: p.salePrice,
        purchasePrice: p.purchasePrice,
        stockQuantity: p.stockQuantity || 0,
        stockValue: p.stockValue || 0,
        minStockLevel: p.minStockLevel || 0,
        maxStockLevel: p.maxStockLevel || 0,
        trackInventory: true,
        variations: (p.variations || []).map((v: any, idx: number) => ({
          id: v.id || `var-${idx}`,
          productId: p._id,
          name: v.name,
          sku: v.sku,
          attributes: v.attributes || {},
          barcode: v.barcode,
          isActive: v.isActive !== false,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          updatedBy: 'system',
        })),
        units: p.unitPricingDetails?.map((up: any) => ({
          id: up.unitId || `unit-${up.unit?.abbreviation}`,
          productId: p._id,
          unit: up.unit?.abbreviation || 'piece',
          price: up.salePrice,
          cost: up.purchasePrice,
          conversionFactor: 1,
          isBaseUnit: up.unitId === p.baseUnitId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          updatedBy: 'system',
        })) || [],
        images: p.images || [],
        metadata: p.metadata || {},
        godowns: [],
        auditLogs: [],
        isActive: p.isActive !== false,
        createdAt: new Date(p.createdAt || Date.now()),
        updatedAt: new Date(p.updatedAt || Date.now()),
        createdBy: p.createdBy || 'system',
        updatedBy: p.updatedBy || 'system',
      }));
      setProducts(convertedProducts )
    }
  }, [convexProducts, setProducts]);

  // Form setup
  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customerId: '',
      billingName: '',
      invoiceDate: new Date(),
      paymentMethod: preferences?.lastUsedPaymentMethod || 'cash',
      paymentAmount: 0, // Whole number, will be converted to cents when saving
      paymentStatus: 'pending',
      discountType: 'percentage',
      discountValue: 0,
    },
  });

  // Convex mutation for creating invoices
  const createInvoiceMutation = useMutation(api.mutations.invoices.createInvoice);

  const currentTab = saleTabs[tabId];
  const customerId = form.watch('customerId');
  const discountType = form.watch('discountType');
  const discountValue = form.watch('discountValue');

  // Load customer when customerId changes - only when customers are loaded
  useEffect(() => {
    if (!convexCustomers || convexCustomers.length === 0) return;
    
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        // Only update if customer changed to prevent unnecessary re-renders
        setSelectedCustomer(prev => {
          if (prev?.id === customer.id) return prev;
          return customer;
        });
        updateCustomerName(tabId, customer.name);
      } else {
        setSelectedCustomer(null);
      }
    } else {
      setSelectedCustomer(null);
    }
  }, [customerId, convexCustomers, customers, tabId, updateCustomerName]);

  // Set initial customer if provided
  useEffect(() => {
    if (initialCustomerName && !customerId && customers.length > 0) {
      const customer = customers.find(c => c.name.toLowerCase().includes(initialCustomerName.toLowerCase()));
      if (customer) {
        form.setValue('customerId', customer.id);
      }
    }
  }, [initialCustomerName, customerId, customers, form]);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPriceCents, 0);
  const discountAmount = discountType === 'percentage' 
    ? Math.round(subtotal * (discountValue / 100))
    : Math.round(discountValue * 100);
  const totalAfterDiscount = subtotal - discountAmount;
  const totalAdditionalCharges = additionalCharges.reduce((sum, charge) => sum + charge.amountCents, 0);
  const total = totalAfterDiscount + totalAdditionalCharges;
  const totalProfit = lineItems.reduce((sum, item) => sum + (item.profitCents || 0), 0);
  const paidAmount = 0; // Will be set when payments are added
  const dueAmount = total - paidAmount;

  // Update store when totals change
  useEffect(() => {
    updateTotal(tabId, subtotal);
  }, [subtotal, tabId, updateTotal]);

  // Don't auto-add line item - start with empty form

  // Update payment status when payment amount changes
  useEffect(() => {
    const paymentAmount = form.watch('paymentAmount') || 0;
    const paymentAmountCents = paymentAmount * 100;
    
    if (paymentAmountCents >= total) {
      form.setValue('paymentStatus', paymentAmountCents > total ? 'overpaid' : 'paid');
    } else if (paymentAmountCents > 0) {
      form.setValue('paymentStatus', 'partial');
    } else {
      form.setValue('paymentStatus', 'pending');
    }
  }, [form.watch('paymentAmount'), total, form]);

  const addNewLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: `line-${Date.now()}-${Math.random()}`,
      invoiceId: '',
      productId: '',
      variationId: undefined,
      unit: '',
      quantity: 1,
      unitPriceCents: 0,
      totalPriceCents: 0,
      discountCents: 0,
      additionalChargesCents: 0,
      costCents: 0,
      profitCents: 0,
      notes: '',
      isReturned: false,
      returnedQuantity: 0,
      originalPriceCents: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUser?.id || 'system',
      updatedBy: currentUser?.id || 'system',
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (index: number, updates: Partial<InvoiceLineItem>) => {
    const updatedItems = lineItems.map((item, i) => 
      i === index ? { ...item, ...updates, updatedAt: new Date() } : item
    );
    setLineItems(updatedItems);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleCustomerChange = (customerId: string) => {
    console.log('Customer changed:', customerId, customers);
    // const customer = customers.find(c => c.id === customerId);
    // if (customer) {
    //   updateCustomerName(tabId, customer.name);
    //   setSelectedCustomer(customer);
    // }
  };

  const handleSubmit = async (data: SaleFormData) => {
    setIsSubmitting(true);
    
    try {
      // Validate line items
      if (lineItems.some(item => !item.productId || item.quantity <= 0)) {
        toast({
          title: "Validation Error",
          description: "Please select products and set quantities for all line items",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check for agreement violations
      const warnings: string[] = [];
      lineItems.forEach(item => {
        if (customerId && item.productId) {
          // This would check price agreements in real implementation
          // For now, we'll add a mock warning if price seems too low
          if (item.unitPriceCents < 100) { // Less than $1
            warnings.push(`${item.productId}: Price seems unusually low`);
          }
        }
      });

      if (warnings.length > 0) {
        setAgreementWarnings(warnings);
        setIsSubmitting(false);
        return;
      }

      // Convert paymentAmount to cents (multiply by 100)
      const paymentAmountCents = (data.paymentAmount || 0) * 100;
      
      // Determine payment status based on payment amount
      let paymentStatus: 'pending' | 'partial' | 'paid' | 'overpaid' = 'pending';
      if (paymentAmountCents >= total) {
        paymentStatus = paymentAmountCents > total ? 'overpaid' : 'paid';
      } else if (paymentAmountCents > 0) {
        paymentStatus = 'partial';
      }

      // Create invoice using Convex mutation
      const invoiceId = await createInvoiceMutation({
        type: 'sale',
        customerId: data.customerId as any,
        billingName: data.billingName || undefined,
        invoiceDate: data.invoiceDate.getTime(), // Convert Date to timestamp
        dueDate: data.dueDate ? data.dueDate.getTime() : undefined,
        discountCents: discountAmount,
        discountType: data.discountType,
        discountValue: data.discountValue,
        paymentMethod: data.paymentMethod,
        paymentAmountCents: paymentAmountCents,
        paymentStatus: paymentStatus,
        commissionAgentId: selectedCommissionAgentId as any,
        notes: data.notes,
        terms: data.terms,
        lineItems: lineItems.map(item => ({
          productId: item.productId as any,
          variationId: item.variationId,
          unit: item.unit,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          discountCents: 0, // No product-wise discount
          notes: item.notes,
        })),
        additionalCharges: additionalCharges.map(charge => ({
          additionalChargeId: charge.additionalChargeId as any,
          lineItemIds: charge.lineItemIds,
        })),
        userEmail: userEmail || undefined,
      });
      
      // Show success toast and reset form
      toast({
        title: "Success",
        description: "Sale created successfully!",
      });
      
      setLineItems([]);
      addNewLineItem();
      form.reset();
      setAgreementWarnings([]);
      
    } catch (error: any) {
      console.error('Error creating sale:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  // {customers.map((customer) => (
  //   <SelectItem key={customer.id} value={customer.id}>
  //     <div className="flex items-center gap-2">
  //       <User className="h-4 w-4" />
  //       <span>{customer.name}</span>
  //       <Badge variant="outline" className="text-xs">
  //         {customer.type}
  //       </Badge>
  //     </div>
  //   </SelectItem>
  // ))}



  return (
    <div className="flex flex-col h-full max-w-[1800px] mx-auto bg-gray-50">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col">
          {/* Header */}
  

          {/* Main Content - Split Layout */}
          <div className="flex-1 flex gap-6 p-6 overflow-hidden">
            {/* Left Column - Form Fields */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
              {/* Invoice Date and Due Date */}
              <Card className="p-4 shadow-sm bg-blue-50 border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          Invoice Date *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          Due Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* Agreement Warnings */}
              {agreementWarnings.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Price Agreement Warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 space-y-1">
                      {agreementWarnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Commission Agent - Moved to Top */}
              <Card className="p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Commission Agent
                </h3>
                <CommissionAgentSelector
                  selectedAgentId={selectedCommissionAgentId}
                  onAgentSelect={setSelectedCommissionAgentId}
                  totalProfitCents={totalProfit}
                  totalAmountCents={total}
                  allowCreate={true}
                />
              </Card>

              {/* Customer and Billing Information */}
              <Card className="p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Customer Information
                  </h3>
                  {customerId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomerDetails(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Customer Details
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{customer.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {customer.type}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                  <FormField
                    control={form.control}
                    name="billingName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter billing name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Amount */}
                  <FormField
                    control={form.control}
                    name="paymentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              className="pl-8"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* Selected Products Summary */}
              {lineItems.filter(item => item.productId).length > 0 && (
                <Card className="p-4 shadow-sm bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-blue-900">
                      <ShoppingCart className="h-4 w-4" />
                      Selected Products ({lineItems.filter(item => item.productId).length})
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {lineItems
                      .filter(item => item.productId)
                      .map((item, idx) => {
                        const product = products.find(p => p.id === item.productId);
                        return product ? (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Package className="h-3 w-3 text-blue-600 flex-shrink-0" />
                              <span className="text-sm font-medium truncate">{product.name}</span>
                              {item.variationId && (
                                <Badge variant="outline" className="text-xs">
                                  {product.variations.find(v => v.id === item.variationId)?.name}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                              <span>Qty: {item.quantity} pcs</span>
                              <span className="font-medium">{formatCurrency(item.totalPriceCents)}</span>
                            </div>
                          </div>
                        ) : null;
                      })}
                  </div>
                </Card>
              )}

              {/* Line Items */}
              <Card className="p-6 shadow-sm">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  Line Items ({lineItems.length})
                </h3>

                {/* Table Header */}
                <div className="grid grid-cols-[2fr_120px_120px_120px_40px] gap-3 mb-2 pb-2 border-b text-sm font-medium text-muted-foreground">
                  <div>Product</div>
                  <div className="text-right">Qty (pcs)</div>
                  <div className="text-right">Price</div>
                  <div className="text-right">Total</div>
                  <div></div>
                </div>

                {/* Line Items List */}
                <div className="space-y-2  h-auto">
                  {lineItems.map((item, index) => (
                    <LineEditor
                      key={item.id}
                      lineItem={item}
                      index={index}
                      customerId={customerId}
                      totalLineItems={lineItems.length}
                      onUpdate={updateLineItem}
                      onRemove={removeLineItem}
                      onShowProductDetails={(product) => {
                        setSelectedProductForDetails(product);
                        setShowProductDetailsOffcanvas(true);
                      }}
                    />
                  ))}
                </div>

                {/* Add Item Button at Bottom */}
                <div className="mt-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addNewLineItem}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </Card>

              {/* Additional Charges & Information - Grouped */}
              <Card className="p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Additional Charges & Information
                </h3>
                
                <div className="space-y-6">
                  {/* Additional Charges Section */}
                  <div className="space-y-4">
                    <ChargesSelector
                      appliedCharges={additionalCharges}
                      onChargesChange={setAdditionalCharges}
                      lineItemIds={lineItems.map(item => item.id)}
                      hideCard={true}
                    />
                  </div>

                  <Separator />

                  {/* Additional Information Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Additional Information
                    </h4>
                    <div className="flex gap-4">
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Additional notes..."
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Terms & Conditions</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Terms and conditions..."
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="w-96 flex-shrink-0">
              {/* Totals Card - Sticky at top */}
              <Card className="p-6 shadow-sm bg-white sticky top-6 z-10">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Summary
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : formatCurrency(discountValue * 100)}):</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  
                  {totalAdditionalCharges > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Additional Charges:</span>
                      <span>{formatCurrency(totalAdditionalCharges)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Due Amount:</span>
                    <span className={cn(
                      "font-medium",
                      dueAmount > 0 ? 'text-orange-600' : 'text-green-600'
                    )}>
                      {formatCurrency(dueAmount)}
                    </span>
                  </div>

                  {/* Discount Input */}
                  <Separator />
                  <div className="space-y-2">
                    <Label>Discount</Label>
                    <div className="flex gap-2">
                      <Select
                        value={discountType}
                        onValueChange={(value: any) => form.setValue('discountType', value)}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed">$</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="0"
                        max={discountType === 'percentage' ? '100' : undefined}
                        step="0.01"
                        value={discountValue}
                        onChange={(e) => form.setValue('discountValue', parseFloat(e.target.value) || 0)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={lineItems.length === 0 || !customerId}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button type="submit" disabled={isSubmitting || lineItems.length === 0 || !customerId}>
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Sale
                  </>
                )}
              </Button>
            </div>
              </Card>
            </div>
          </div>
        </form>
      </Form>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Sale Preview</DialogTitle>
            <DialogDescription>
              Review the sale details before saving.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-4">
              {/* Customer Info */}
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Customer: {selectedCustomer?.name || 'N/A'}</div>
                  <div>Invoice Date: {form.watch('invoiceDate')?.toLocaleDateString()}</div>
                  <div>Payment Method: {form.watch('paymentMethod')}</div>
                  <div>Due Date: {form.watch('dueDate')?.toLocaleDateString() || 'N/A'}</div>
                </div>
              </Card>

              {/* Line Items */}
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Line Items ({lineItems.length})</h4>
                <div className="space-y-2">
                  {lineItems.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <div key={item.id} className="flex justify-between text-sm border-b pb-2">
                        <div>
                          <span className="font-medium">Item {index + 1}:</span> {product?.name || item.productId || 'No product selected'}
                          {item.quantity > 0 && (
                            <span className="text-muted-foreground"> × {item.quantity} pcs</span>
                          )}
                        </div>
                        <span className="font-medium">
                          {formatCurrency(item.totalPriceCents)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Totals */}
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Totals</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {totalAdditionalCharges > 0 && (
                    <div className="flex justify-between">
                      <span>Additional Charges:</span>
                      <span>{formatCurrency(totalAdditionalCharges)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-blue-600">
                    <span>Payment Amount:</span>
                    <span className="font-semibold">{formatCurrency((form.watch('paymentAmount') || 0) * 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Amount:</span>
                    <span className={cn(
                      "font-semibold",
                      (total - (form.watch('paymentAmount') || 0) * 100) > 0 ? "text-orange-600" : "text-green-600"
                    )}>
                      {formatCurrency(Math.max(0, total - (form.watch('paymentAmount') || 0) * 100))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>Payment Status:</span>
                    <Badge variant={
                      form.watch('paymentStatus') === 'paid' ? 'default' :
                      form.watch('paymentStatus') === 'partial' ? 'secondary' :
                      'outline'
                    }>
                      {form.watch('paymentStatus')}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Notes */}
              {(form.watch('notes') || form.watch('terms')) && (
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Additional Information</h4>
                  {form.watch('notes') && (
                    <div className="text-sm">
                      <span className="font-medium">Notes:</span> {form.watch('notes')}
                    </div>
                  )}
                  {form.watch('terms') && (
                    <div className="text-sm mt-2">
                      <span className="font-medium">Terms:</span> {form.watch('terms')}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowPreview(false);
              form.handleSubmit(handleSubmit)();
            }}>
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        customerId={customerId || null}
        open={showCustomerDetails}
        onOpenChange={setShowCustomerDetails}
      />

      {/* Product Details Offcanvas */}
      <ProductDetailsOffcanvas
        open={showProductDetailsOffcanvas}
        onOpenChange={setShowProductDetailsOffcanvas}
        product={selectedProductForDetails}
        customerId={customerId}
      />
    </div>
  );
}
