"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, Trash2, Calculator, Eye, Save, RefreshCw, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { useProductStore } from "@/store/useProductStore";
import { useInvoiceStore } from "@/store/useInvoiceStore";
import { useUserStore } from "@/store/useUserStore";
import { useSettingsStore } from "@/store/useSettingsStore";

import { LineEditor } from "@/components/shared/LineEditor";
import { ChargesSelector } from "@/components/shared/ChargesSelector";
import { ProductSelector } from "@/components/shared/ProductSelector";
import { AgreementWarning } from "@/components/shared/AgreementWarning";
import { AuditTimeline } from "@/components/shared/AuditTimeline";

import type {
  Invoice,
  InvoiceLineItem,
  Customer,
  AdditionalCharge,
  AppliedAdditionalCharge,
} from "@/types/models";

const purchaseFormSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
  purchaseDate: z.date(),
  dueDate: z.date().optional(),
  status: z.enum(["draft", "pending", "approved", "paid", "overdue", "cancelled"]),
  paymentStatus: z.enum(["pending", "partial", "paid", "overpaid", "refunded"]),
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
  }).format(amount).replace(/BDT/g, '৳').trim();
};

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

interface EnhancedPurchaseFormProps {
  initialData?: Partial<Invoice>;
  onSave?: (invoice: Invoice) => void;
  onCancel?: () => void;
}

export function EnhancedPurchaseForm({
  initialData,
  onSave,
  onCancel,
}: EnhancedPurchaseFormProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [agreementWarnings, setAgreementWarnings] = useState<string[]>([]);

  const { products, checkPriceAgreement } = useProductStore();
  const {
    currentInvoice: invoice,
    addLineItem,
    updateLineItem,
    removeLineItem,
    calculateTotals,
    addAdditionalCharge,
    removeAdditionalCharge,
    updateAdditionalCharge,
    clearInvoice,
  } = useInvoiceStore();

  const { currentUser, hasPermission } = useUserStore();
  const { settings } = useSettingsStore();

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      supplierId: initialData?.supplierId || "",
      invoiceNumber: initialData?.invoiceNumber || "",
      notes: initialData?.notes || "",
      purchaseDate: initialData?.invoiceDate
        ? new Date(initialData.invoiceDate)
        : new Date(),
      dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : undefined,
      status: initialData?.status || "draft",
      paymentStatus: initialData?.paymentStatus || "pending",
    },
  });

  const { watch, setValue } = form;
  const purchaseDate = watch("purchaseDate");
  const dueDate = watch("dueDate");
  const status = watch("status");

  // Calculate totals whenever invoice changes
  useEffect(() => {
    calculateTotals();
  }, [invoice?.lineItems, invoice?.additionalCharges, calculateTotals]);

  // Check price agreements when line items change
  useEffect(() => {
    const warnings: string[] = [];

    invoice?.lineItems.forEach((lineItem, index) => {
      if (lineItem.productId) {
        const product = products.find((p) => p.id === lineItem.productId);
        if (product) {
          const agreementCheck = checkPriceAgreement(
            lineItem.productId,
            lineItem.unitPriceCents / 100, // Convert cents to decimal
            lineItem.quantity,
            lineItem.unit,
            invoice?.customerId || ""
          );

          if (!agreementCheck.isCompliant) {
            warnings.push(`Line ${index + 1}: ${agreementCheck.message}`);
          }
        }
      }
    });

    setAgreementWarnings(warnings);
  }, [invoice?.lineItems, invoice?.customerId, products, checkPriceAgreement]);

  const handleAddLineItem = () => {
    const newLineItem: InvoiceLineItem = {
      id: `line_${Date.now()}`,
      productId: "",
      invoiceId: invoice?.id || "",
      variationId: undefined,
      unitPriceCents: 0,
      unit: "",
      quantity: 1,
      totalPriceCents: 0,
      discountCents: 0,
      additionalChargesCents: 0,
      notes: "",
      isReturned: false,
      returnedQuantity: 0,
      originalPriceCents: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUser?.id || "system",
      updatedBy: currentUser?.id || "system",
    };
    addLineItem(newLineItem);
  };

  const handleLineItemUpdate = (
    lineItemId: string,
    updates: Partial<InvoiceLineItem>
  ) => {
    updateLineItem(lineItemId, updates);
  };

  const handleLineItemRemove = (lineItemId: string) => {
    removeLineItem(lineItemId);
  };

  const handleProductSelect = (productId: string, lineItemId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const defaultVariation = product.variations?.[0];
      const defaultUnit = product.units?.[0];

      handleLineItemUpdate(lineItemId, {
        productId,
        variationId: defaultVariation?.id,
        unit: defaultUnit?.unit || product.baseUnit,
        unitPriceCents: Math.round((defaultUnit?.cost || 0) * 100),
        originalPriceCents: Math.round((defaultUnit?.cost || 0) * 100),
      });
    }
  };

  const handleChargeUpdate = (charge: AdditionalCharge) => {
    const appliedCharge: Partial<AppliedAdditionalCharge> = {
      id: charge.id,
      name: charge.name,
      type: charge.type,
      value: charge.value,
      applyTo: charge.applyTo === "both" ? "global" : charge.applyTo,
      amountCents: Math.round(charge.value * 100),
      isTaxable: charge.isTaxable,
    };
    updateAdditionalCharge(charge.id, appliedCharge);
  };

  const handleChargeRemove = (chargeId: string) => {
    const index = invoice?.additionalCharges.findIndex(charge => charge.id === chargeId);
    if (index !== undefined && index !== -1) {
      removeAdditionalCharge(index);
    }
  };

  const handleAddCharge = (type: "percentage" | "fixed") => {
    const newCharge: AppliedAdditionalCharge = {
      id: `charge_${Date.now()}`,
      invoiceId: invoice?.id || "",
      additionalChargeId: `template_${Date.now()}`,
      name: type === "percentage" ? "Discount" : "Additional Fee",
      type,
      value: 0,
      applyTo: "global",
      amountCents: 0,
      isTaxable: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUser?.id || "system",
      updatedBy: currentUser?.id || "system",
    };
    addAdditionalCharge(newCharge);
  };

  const onSubmit = (data: PurchaseFormData) => {
    if (!hasPermission("purchases", "create")) {
      alert("You don't have permission to create purchases");
      return;
    }

    if (!invoice || invoice.lineItems.length === 0) {
      alert("Please add at least one line item");
      return;
    }

    if (
      agreementWarnings.length > 0 &&
      settings.priceAgreementAction === "block"
    ) {
      alert("Please resolve price agreement violations before saving");
      return;
    }

    const totals = calculateTotals();
    const purchaseInvoice: Invoice = {
      id: initialData?.id || `purchase_${Date.now()}`,
      invoiceNumber: data.invoiceNumber || `PUR-${Date.now()}`,
      type: "purchase",
      supplierId: data.supplierId,
      billingName: data.supplierId, // Will be resolved to supplier name
      invoiceDate: data.purchaseDate,
      dueDate: data.dueDate,
      subtotalCents: Math.round(totals.subtotal * 100),
      discountCents: Math.round(totals.discount * 100),
      discountType: "percentage",
      discountValue: 0,
      additionalChargesCents: Math.round(totals.tax * 100), // Using tax for additional charges
      taxCents: 0, // No separate tax calculation for purchases
      totalCents: Math.round(totals.total * 100),
      paidCents: 0,
      dueCents: Math.round(totals.total * 100),
      status: "draft",
      paymentStatus: "pending",
      paymentMethod: "cash", // Default payment method - will be updated when payment is made
      lineItems: invoice?.lineItems || [],
      additionalCharges: invoice?.additionalCharges.map(charge => ({
        ...charge,
        amountCents: Math.round(charge.amountCents)
      })) || [],
      payments: [],
      returns: [],
      isLocked: false,
      auditLogs: [],
      createdAt: initialData?.createdAt || new Date(),
      updatedAt: new Date(),
      createdBy: currentUser?.id || "system",
      updatedBy: currentUser?.id || "system",
    };

    onSave?.(purchaseInvoice);
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplierId">Supplier *</Label>
                    <Input
                      id="supplierId"
                      {...form.register("supplierId")}
                      placeholder="Enter supplier name or ID"
                    />
                    {form.formState.errors.supplierId && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.supplierId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference #</Label>
                    <Input
                      id="reference"
                      {...form.register("invoiceNumber")}
                      placeholder="Purchase order reference"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Purchase Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {purchaseDate ? (
                            format(purchaseDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={purchaseDate}
                          onSelect={(date) =>
                            setValue("purchaseDate", date || new Date())
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {dueDate ? (
                            format(dueDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={(date) => setValue("dueDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value) =>
                        setValue("status", value as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select
                      value={watch("paymentStatus")}
                      onValueChange={(value) =>
                        setValue("paymentStatus", value as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Line Items</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLineItem}
                    disabled={!hasPermission("purchases", "create")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {agreementWarnings.length > 0 && (
                  <div className="space-y-2">
                    {agreementWarnings.map((warning, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{warning}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {invoice?.lineItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No items added yet. Click "Add Item" to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoice?.lineItems.map((lineItem, index) => (
                      <LineEditor
                        key={lineItem.id}
                        lineItem={lineItem}
                        index={index}
                        totalLineItems={invoice?.lineItems.length || 0}
                        onUpdate={(idx, updates) =>
                          handleLineItemUpdate(lineItem.id, updates)
                        }
                        onRemove={(idx) => handleLineItemRemove(lineItem.id)}
                        className="mb-4"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Charges */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Additional Charges</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCharge("percentage")}
                    >
                      Add Discount
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCharge("fixed")}
                    >
                      Add Fee
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChargesSelector
                  appliedCharges={invoice?.additionalCharges || []}
                  onChargesChange={(charges) => {
                    // Update all charges
                    charges.forEach(charge => {
                      handleChargeUpdate({
                        id: charge.id,
                        name: charge.name,
                        type: charge.type,
                        value: charge.value,
                        applyTo: charge.applyTo,
                        isActive: true,
                        isTaxable: charge.isTaxable,
                        defaultEnabled: false,
                        description: '',
                        sortOrder: 0,
                        createdAt: charge.createdAt,
                        updatedAt: charge.updatedAt,
                        createdBy: charge.createdBy,
                        updatedBy: charge.updatedBy,
                        auditLogs: []
                      });
                    });
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary and Actions */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{totals.subtotal.toFixed(2)}</span>
                  </div>

                  {invoice?.additionalCharges
                    .filter((charge) => charge.value > 0)
                    .map((charge, index) => (
                      <div key={charge.id} className="flex justify-between">
                        <span className="text-muted-foreground">
                          {charge.name}:
                        </span>
                        <span>
                          {charge.type === "percentage"
                            ? `${charge.value}% (${(
                                (totals.subtotal * charge.value) /
                                100
                              ).toFixed(2)})`
                            : charge.value.toFixed(2)}
                        </span>
                      </div>
                    ))}

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>{totals.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAuditLog(!showAuditLog)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    History
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!hasPermission("purchases", "create")}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Purchase
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear all data?")) {
                      clearInvoice();
                      form.reset();
                    }
                  }}
                >
                  Clear Form
                </Button>

                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Permissions Info */}
            {!hasPermission("purchases", "create") && (
              <Alert>
                <AlertDescription>
                  You don't have permission to create purchases. Contact your
                  administrator.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Purchase Preview</h2>
                <Button variant="ghost" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Supplier Information</h3>
                    <p>Supplier: {watch("supplierId")}</p>
                    <p>Reference: {watch("invoiceNumber") || "N/A"}</p>
                    <p>Date: {format(watch("purchaseDate"), "PPP")}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Purchase Details</h3>
                    <p>Status: {watch("status")}</p>
                    <p>Payment: {watch("paymentStatus")}</p>
                    {watch("dueDate") && (
                      <p>Due: {format(watch("dueDate")!, "PPP")}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Line Items</h3>
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Product</th>
                          <th className="px-4 py-2 text-left">Qty</th>
                          <th className="px-4 py-2 text-left">Unit</th>
                          <th className="px-4 py-2 text-right">Price</th>
                          <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice?.lineItems.map((item) => {
                          const product = products.find(p => p.id === item.productId);
                          return (
                            <tr key={item.id}>
                              <td className="px-4 py-2">{product?.name || "Unknown Product"}</td>
                              <td className="px-4 py-2">{item.quantity}</td>
                              <td className="px-4 py-2">{item.unit}</td>
                              <td className="px-4 py-2 text-right">
                                {formatCurrency(item.unitPriceCents / 100)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {formatCurrency(item.totalPriceCents / 100)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="text-right space-y-2">
                    <p>Subtotal: {totals.subtotal.toFixed(2)}</p>
                    {invoice?.additionalCharges
                      .filter((charge) => charge.value > 0)
                      .map((charge) => (
                        <p key={charge.id}>
                          {charge.name}:{" "}
                          {charge.type === "percentage"
                            ? `${charge.value}% (${(
                                (totals.subtotal * charge.value) /
                                100
                              ).toFixed(2)})`
                            : charge.value.toFixed(2)}
                        </p>
                      ))}
                    <p className="font-bold text-lg">
                      Total: {totals.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Purchase History</h2>
                <Button variant="ghost" onClick={() => setShowAuditLog(false)}>
                  Close
                </Button>
              </div>

              <AuditTimeline
                auditLogs={[]}
                entityType="purchase"
                entityId={initialData?.id || ""}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}