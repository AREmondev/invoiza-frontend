"use client";

import { useState, useEffect } from 'react';
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
import { ProductSelector, LineEditor, ChargesSelector, BillingAliasSelector, CustomerDueHistory, PaymentModule } from '@/components/shared';
import { CommissionAgentSelector } from '@/components/shared/CommissionAgentSelector';
import { useSaleStore } from '@/store/useSaleStore';
import { useProductStore } from '@/store/useProductStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { useUserStore } from '@/store/useUserStore';
import { useSettingsStore } from '@/store/useSettingsStore';

// Import types
import { InvoiceLineItem, AppliedAdditionalCharge, CreateInvoiceDTO, Customer } from '@/types';
import { mockCustomers } from '@/lib/mock-data';

interface EnhancedSaleFormProps {
  tabId: string;
  initialCustomerName?: string;
}

// Form validation schema
const saleFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  billingAliasId: z.string().optional(),
  invoiceDate: z.date(),
  dueDate: z.date().optional(),
  paymentMethod: z.string().min(1, 'Payment method is required'),
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

  // Store hooks
  const { saleTabs, updateCustomerName, updateBillingName, updateDiscount, updateTotal } = useSaleStore();
  const { products } = useProductStore();
  const { createInvoice, calculateSubtotal, calculateTotal, calculateDueAmount } = useInvoiceStore();
  const { currentUser, preferences } = useUserStore();
  const { features, businessRules } = useSettingsStore();

  // Form setup
  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customerId: '',
      billingAliasId: '',
      invoiceDate: new Date(),
      paymentMethod: preferences?.lastUsedPaymentMethod || 'cash',
      paymentStatus: 'pending',
      discountType: 'percentage',
      discountValue: 0,
    },
  });

  const currentTab = saleTabs[tabId];
  const customerId = form.watch('customerId');
  const discountType = form.watch('discountType');
  const discountValue = form.watch('discountValue');

  // Load customer when customerId changes
  useEffect(() => {
    if (customerId) {
      const customer = mockCustomers.find(c => c.id === customerId);
      setSelectedCustomer(customer || null);
      if (customer) {
        updateCustomerName(tabId, customer.name);
      }
    } else {
      setSelectedCustomer(null);
    }
  }, [customerId, tabId, updateCustomerName]);

  // Set initial customer if provided
  useEffect(() => {
    if (initialCustomerName && !customerId) {
      const customer = mockCustomers.find(c => c.name.toLowerCase().includes(initialCustomerName.toLowerCase()));
      if (customer) {
        form.setValue('customerId', customer.id);
      }
    }
  }, [initialCustomerName, customerId, form]);

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

  // Add initial line item when form loads
  useEffect(() => {
    if (lineItems.length === 0) {
      addNewLineItem();
    }
  }, []);

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
    const customer = mockCustomers.find(c => c.id === customerId);
    if (customer) {
      updateCustomerName(tabId, customer.name);
      setSelectedCustomer(customer);
    }
  };

  const handleSubmit = async (data: SaleFormData) => {
    setIsSubmitting(true);
    
    try {
      // Validate line items
      if (lineItems.some(item => !item.productId || item.quantity <= 0)) {
        alert('Please select products and set quantities for all line items');
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

      // Create invoice DTO
      const invoiceData: CreateInvoiceDTO = {
        type: 'sale',
        customerId: data.customerId,
        billingName: data.billingAliasId ? `alias-${data.billingAliasId}` : undefined,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        discountCents: discountAmount,
        discountType: data.discountType,
        discountValue: data.discountValue,
        commissionAgentId: selectedCommissionAgentId,
        notes: data.notes,
        terms: data.terms,
        lineItems: lineItems.map(item => ({
          productId: item.productId,
          variationId: item.variationId,
          unit: item.unit,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          discountCents: item.discountCents,
          notes: item.notes,
        })),
        additionalCharges: additionalCharges.map(charge => ({
          additionalChargeId: charge.additionalChargeId,
          lineItemIds: charge.lineItemIds,
        })),
      };

      // Create invoice (will be connected to Convex)
      console.log('Creating invoice:', invoiceData);
      await createInvoice(invoiceData);
      
      // Show success and reset form
      alert('Sale created successfully!');
      setLineItems([]);
      addNewLineItem();
      form.reset();
      setAgreementWarnings([]);
      
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error creating sale. Please try again.');
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

  return (
    <div className="flex flex-col h-full max-w-[1800px] mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">New Sale</h2>
              {selectedCustomer && (
                <Badge variant="outline" className="text-sm">
                  {selectedCustomer.name}
                </Badge>
              )}
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
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Sale'}
              </Button>
            </div>
          </div>

          {/* Main Content - Split Layout */}
          <div className="flex-1 flex gap-4 p-4 overflow-hidden">
            {/* Left Column - Form Fields */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
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

              {/* Customer and Billing Information */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer *</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          handleCustomerChange(value);
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockCustomers.map((customer) => (
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

                  {customerId && features?.billingAliases && (
                    <BillingAliasSelector
                      customerId={customerId}
                      selectedAliasId={form.watch('billingAliasId')}
                      onAliasSelect={(aliasId) => form.setValue('billingAliasId', aliasId)}
                      allowCreate={true}
                      allowEdit={true}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={format(field.value, 'yyyy-MM-dd')}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
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
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
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
                </div>
              </Card>

              {/* Customer Due History */}
              {customerId && selectedCustomer && (
                <CustomerDueHistory
                  customerId={customerId}
                  customer={selectedCustomer}
                  invoices={[]}
                  payments={[]}
                />
              )}

              {/* Line Items */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Line Items ({lineItems.length})
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addNewLineItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-4 pr-4">
                    {lineItems.map((item, index) => (
                      <LineEditor
                        key={item.id}
                        lineItem={item}
                        index={index}
                        customerId={customerId}
                        onUpdate={updateLineItem}
                        onRemove={removeLineItem}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              {/* Additional Charges */}
              <ChargesSelector
                appliedCharges={additionalCharges}
                onChargesChange={setAdditionalCharges}
                lineItemIds={lineItems.map(item => item.id)}
              />

              {/* Commission Agent */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
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

              {/* Payment Module */}
              <PaymentModule
                invoiceId=""
                totalAmount={total}
                paidAmount={paidAmount}
                dueAmount={dueAmount}
                onPaymentAdd={(payment) => {
                  // Handle payment addition
                  console.log('Payment added:', payment);
                }}
                existingPayments={[]}
              />

              {/* Notes */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            className="w-full p-3 border rounded-md resize-none"
                            rows={3}
                            placeholder="Additional notes..."
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
                      <FormItem>
                        <FormLabel>Terms & Conditions</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            className="w-full p-3 border rounded-md resize-none"
                            rows={3}
                            placeholder="Terms and conditions..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-4">
              {/* Totals Card */}
              <Card className="p-4 sticky top-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
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
                          {item.quantity > 1 && (
                            <span className="text-muted-foreground"> × {item.quantity}</span>
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
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
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
    </div>
  );
}
