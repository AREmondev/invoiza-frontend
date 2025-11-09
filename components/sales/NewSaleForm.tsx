"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { ItemsTable } from "@/components/sales/ItemsTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSaleStore } from "@/store/useSaleStore";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const sampleCustomers = [
  { value: "1", label: "John Doe" },
  { value: "2", label: "Jane Smith" },
  { value: "3", label: "Bob Johnson" },
];

interface NewSaleFormProps {
  tabId: string;
  initialCustomerName?: string;
}

export function NewSaleForm({
  tabId,
  initialCustomerName = "",
}: NewSaleFormProps) {
  const [customerId, setCustomerId] = useState<string>("");
  const [billingNameInput, setBillingNameInput] = useState<string>("");
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [additionalCharge, setAdditionalCharge] = useState<number>(0);
  const [paymentReceived, setPaymentReceived] = useState<number>(0);
  const { updateCustomerName, updateBillingName, updateDiscount, updateTotal } =
    useSaleStore();

  const saleSchema = z.object({
    billingName: z.string().min(1, "Billing name is required"),
    discount: z.coerce.number().min(0, "Min 0%").max(100, "Max 100%"),
    additionalCharge: z.coerce.number().min(0, "Must be >= 0"),
    paymentReceived: z.coerce.number().min(0, "Must be >= 0"),
    paymentStatus: z.enum(["paid", "pending", "failed"]).default("pending"),
    paymentMethod: z.enum(["credit_card", "bank_transfer", "cash"]).default("cash"),
  });

  const form = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      billingName: billingNameInput,
      discount: useSaleStore((s) => s.saleTabs[tabId]?.discount || 0),
      additionalCharge,
      paymentReceived,
      paymentStatus: "pending",
      paymentMethod: "cash",
    },
  });
  useEffect(() => {
    if (initialCustomerName) {
      updateCustomerName(tabId, initialCustomerName);
    }
  }, [initialCustomerName, tabId]);

  const handleCustomerChange = (value: string) => {
    setCustomerId(value);
    const customer = sampleCustomers.find((c) => c.value === value);
    if (customer) {
      updateCustomerName(tabId, customer.label);
    }
  };

  const handleBillingNameChange = (value: string) => {
    setBillingNameInput(value);
    updateBillingName(tabId, value);
  };

  const handleDiscountChange = (value: string) => {
    const discount = parseFloat(value) || 0;
    updateDiscount(tabId, discount);
  };

  const handleTotalChange = (total: number) => {
    updateTotal(tabId, total);
  };

  const subtotal = useSaleStore((state) => state.saleTabs[tabId]?.total || 0);
  const discount = useSaleStore(
    (state) => state.saleTabs[tabId]?.discount || 0
  );
  const discountedTotal = subtotal * (1 - discount / 100);
  const invoiceAmount = discountedTotal + (additionalCharge || 0);
  const roundedInvoice = Math.round(invoiceAmount);
  const roundOffDiff = roundedInvoice - invoiceAmount;
  const dueAmount = Math.max(0, roundedInvoice - (paymentReceived || 0));

  return (
    <div className="max-w-4xl mx-auto pb-56">
      <div className="space-y-6">
        <Form {...form}>
          {/* Customer selection remains outside RHF */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <SearchableSelect
              options={sampleCustomers}
              value={customerId}
              onChange={handleCustomerChange}
              placeholder="Select customer"
              onAddNew={() => {
                window.dispatchEvent(
                  new KeyboardEvent("keydown", {
                    key: "c",
                    metaKey: true,
                    bubbles: true,
                  })
                );
              }}
            />
          </div>

          <div className="space-y-2">
            <FormField
              control={form.control}
              name="billingName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Name</FormLabel>
                  <FormControl>
                    <Input
                      id="billingName"
                      placeholder="Enter billing name"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleBillingNameChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={field.value ?? 0}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? "" : Number(val));
                          updateDiscount(tabId, parseFloat(val) || 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? dueDate.toDateString() : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="additionalCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Charge</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? 0}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? "" : Number(val));
                          setAdditionalCharge(parseFloat(val) || 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="paymentReceived"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Received</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? 0}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? "" : Number(val));
                          setPaymentReceived(parseFloat(val) || 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Items</Label>
            <ItemsTable
              onAddItem={() => setIsAddItemModalOpen(true)}
              onChange={handleTotalChange}
              additionalCharge={additionalCharge}
            />
          </div>
        </Form>
        {/* Actions moved to sticky footer */}
      </div>

      {/* Sticky Totals & Actions Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
          isCollapsed ? "p-2" : "p-4"
        } z-50 `}
      >
        <div className="absolute top-2 right-2">
          <Button
            variant="default"
            size="icon"
            className="shadow"
            aria-label={isCollapsed ? "Expand totals" : "Collapse totals"}
            onClick={() => setIsCollapsed((v) => !v)}
          >
            {isCollapsed ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="max-w-4xl mx-auto flex justify-between items-start">
          {!isCollapsed && (
            <div className="text-sm font-medium space-y-1">
              <div>Subtotal: ৳{subtotal.toFixed(2)}</div>
              <div>Discount: {discount}%</div>
              <div>Invoice: ৳{invoiceAmount.toFixed(2)}</div>
              <div>
                Round Off: {roundOffDiff >= 0 ? "+" : ""}
                {roundOffDiff.toFixed(2)}
              </div>
              <div>Invoice (Rounded): ৳{roundedInvoice.toFixed(2)}</div>
              <div>Payment Received: ৳{paymentReceived.toFixed(2)}</div>
              <div>Due: ৳{dueAmount.toFixed(2)}</div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button variant="outline">Clear</Button>
            <Button variant="secondary" onClick={() => setIsPreviewOpen(true)}>
              Preview
            </Button>
            <Button onClick={() => setIsPreviewOpen(true)}>Save Sale</Button>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input />
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input type="number" />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAddItemModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setIsAddItemModalOpen(false)}>
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sale Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Customer:</strong>{" "}
              {useSaleStore((s) => s.saleTabs[tabId]?.customerName || "-")}
            </div>
            <div>
              <strong>Billing Name:</strong>{" "}
              {useSaleStore((s) => s.saleTabs[tabId]?.billingName || "-")}
            </div>
            <div>
              <strong>Due Date:</strong>{" "}
              {dueDate ? dueDate.toDateString() : "-"}
            </div>
            <div>
              <strong>Subtotal:</strong> ৳{subtotal.toFixed(2)}
            </div>
            <div>
              <strong>Discount:</strong> {discount}%
            </div>
            <div>
              <strong>Additional Charge:</strong> ৳{additionalCharge.toFixed(2)}
            </div>
            <div>
              <strong>Invoice (Rounded):</strong> ৳{roundedInvoice.toFixed(2)}
            </div>
            <div>
              <strong>Payment Received:</strong> ৳{paymentReceived.toFixed(2)}
            </div>
            <div>
              <strong>Due:</strong> ৳{dueAmount.toFixed(2)}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setIsPreviewOpen(false)}>
              Confirm & Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
