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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { EnhancedSaleForm } from "./EnhancedSaleForm";
// Update new code
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
    paymentMethod: z
      .enum(["credit_card", "bank_transfer", "cash"])
      .default("cash"),
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
  <EnhancedSaleForm tabId={tabId} initialCustomerName={initialCustomerName} />
  );
}
