"use client";

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useSession } from 'next-auth/react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DollarSign, 
  CreditCard, 
  Building2, 
  Wallet, 
  FileText, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/convex';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CustomerPaymentModalProps {
  customerId: string | null;
  customerName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: () => void;
}

// Helper function to get icon component based on payment method type
const getIconComponent = (type?: string) => {
  switch (type) {
    case 'cash':
      return Wallet;
    case 'bank':
      return Building2;
    case 'e_wallet':
      return Wallet;
    case 'card':
      return CreditCard;
    case 'check':
      return DollarSign;
    default:
      return DollarSign;
  }
};

export function CustomerPaymentModal({
  customerId,
  customerName,
  open,
  onOpenChange,
  onPaymentSuccess,
}: CustomerPaymentModalProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'all' | 'selected' | 'custom'>('all');

  // Fetch payment methods from database
  const dbPaymentMethods = useQuery(
    api.queries.paymentMethods.getPaymentMethods,
    userEmail ? { userEmail } : "skip"
  ) || [];

  // Transform payment methods for display
  const paymentMethods = useMemo(() => {
    if (dbPaymentMethods.length > 0) {
      return dbPaymentMethods
        .filter((m: any) => m.isActive)
        .map((method: any) => ({
          code: method.code,
          name: method.name,
          type: method.type || 'other',
        }));
    }
    // Fallback if no payment methods exist
    return [
      { code: 'cash', name: 'Cash', type: 'cash' },
      { code: 'bank_transfer', name: 'Bank Transfer', type: 'bank' },
    ];
  }, [dbPaymentMethods]);

  // Set default payment method when methods load
  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(paymentMethods[0].code);
    }
  }, [paymentMethods, paymentMethod]);

  // Fetch unpaid invoices
  const unpaidInvoices = useQuery(
    api.queries.invoices.getCustomerUnpaidInvoices,
    customerId && userEmail ? { customerId: customerId as any, userEmail } : "skip"
  ) || [];

  // Payment mutation
  const createPayment = useMutation(api.mutations.payments.createPayment);

  useEffect(() => {
    if (open && unpaidInvoices.length > 0) {
      // Auto-select all invoices
      setSelectedInvoices(new Set(unpaidInvoices.map((inv: any) => inv._id)));
      setPaymentMode('all');
    }
  }, [open, unpaidInvoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100).replace(/BDT/g, '৳').trim();
  };

  // Calculate totals
  const totalDueCents = unpaidInvoices.reduce((sum: number, inv: any) => {
    return sum + (inv.calculatedDueCents || inv.dueCents || 0);
  }, 0);

  const selectedDueCents = unpaidInvoices.reduce((sum: number, inv: any) => {
    if (selectedInvoices.has(inv._id)) {
      return sum + (inv.calculatedDueCents || inv.dueCents || 0);
    }
    return sum;
  }, 0);

  const handleSelectAll = () => {
    if (selectedInvoices.size === unpaidInvoices.length) {
      setSelectedInvoices(new Set());
      setPaymentMode('custom');
    } else {
      setSelectedInvoices(new Set(unpaidInvoices.map((inv: any) => inv._id)));
      setPaymentMode('all');
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
    setPaymentMode('selected');
  };

  const handlePaymentModeChange = (mode: 'all' | 'selected' | 'custom') => {
    setPaymentMode(mode);
    if (mode === 'all') {
      setSelectedInvoices(new Set(unpaidInvoices.map((inv: any) => inv._id)));
      setPaymentAmount('');
    } else if (mode === 'selected') {
      setPaymentAmount('');
    }
  };

  const handleSetFullAmount = () => {
    if (paymentMode === 'all') {
      setPaymentAmount((totalDueCents / 100).toFixed(2));
    } else if (paymentMode === 'selected') {
      setPaymentAmount((selectedDueCents / 100).toFixed(2));
    }
  };

  const handleSubmit = async () => {
    if (!customerId) {
      toast({
        title: "Error",
        description: "Customer ID is required",
        variant: "destructive",
      });
      return;
    }

    if (selectedInvoices.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one invoice",
        variant: "destructive",
      });
      return;
    }

    const paymentAmountCents = Math.round(parseFloat(paymentAmount || '0') * 100);
    if (paymentAmountCents <= 0) {
      toast({
        title: "Error",
        description: "Payment amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payments array
      const payments: Array<{
        invoiceId: any;
        amountCents: number;
        paymentMethod: string;
        reference?: string;
        notes?: string;
        paymentDate: number;
      }> = [];

      // FIFO (First In First Out) - Pay oldest invoices first
      const selectedInvoicesList = unpaidInvoices
        .filter((inv: any) => selectedInvoices.has(inv._id))
        .sort((a: any, b: any) => a.invoiceDate - b.invoiceDate); // Sort by date ascending (oldest first)

      let remainingAmount = paymentAmountCents;
      
      // Pay invoices sequentially (FIFO)
      for (const inv of selectedInvoicesList) {
        if (remainingAmount <= 0) break;
        
        const invDue = inv.calculatedDueCents || inv.dueCents || 0;
        
        if (invDue <= 0) continue; // Skip if no due amount
        
        // Pay as much as possible for this invoice (up to its due amount or remaining payment)
        const amountForInvoice = Math.min(remainingAmount, invDue);
        
        if (amountForInvoice > 0) {
          payments.push({
            invoiceId: inv._id,
            amountCents: amountForInvoice,
            paymentMethod,
            reference: paymentReference || undefined,
            notes: paymentNotes || undefined,
            paymentDate: paymentDate.getTime(),
          });
          
          remainingAmount -= amountForInvoice;
        }
      }

      if (payments.length === 0) {
        toast({
          title: "Error",
          description: "No valid payments to process",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      await createPayment({
        customerId: customerId as any,
        payments,
        userEmail,
      });

      toast({
        title: "Success",
        description: `Payment of ${formatCurrency(paymentAmountCents)} processed successfully`,
      });

      // Reset form
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      setPaymentDate(new Date());
      setSelectedInvoices(new Set(unpaidInvoices.map((inv: any) => inv._id)));
      setPaymentMode('all');

      onPaymentSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: 'Pending', variant: 'secondary' },
      partial: { label: 'Partial', variant: 'outline' },
      paid: { label: 'Paid', variant: 'default' },
      overpaid: { label: 'Overpaid', variant: 'default' },
    };

    const config = statusMap[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Make Payment
            {customerName && (
              <span className="text-muted-foreground font-normal">
                - {customerName}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Review unpaid invoices and process payment
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalDueCents)}
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Selected Due</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(selectedDueCents)}
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Unpaid Invoices</p>
                <p className="text-2xl font-bold">
                  {unpaidInvoices.length}
                </p>
              </div>
            </Card>
          </div>

          {/* Invoice List */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Unpaid Invoices
                </h3>
                <Badge variant="outline" className="text-xs">
                  FIFO - Oldest First
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedInvoices.size === unpaidInvoices.length && unpaidInvoices.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm">Select All</Label>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {unpaidInvoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No unpaid invoices found</p>
                  </div>
                ) : (
                  unpaidInvoices.map((invoice: any) => {
                    const isSelected = selectedInvoices.has(invoice._id);
                    const dueAmount = invoice.calculatedDueCents || invoice.dueCents || 0;
                    
                    return (
                      <Card
                        key={invoice._id}
                        className={cn(
                          "p-4 cursor-pointer transition-colors",
                          isSelected && "border-primary bg-primary/5"
                        )}
                        onClick={() => handleSelectInvoice(invoice._id)}
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectInvoice(invoice._id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {invoice.invoiceNumber}
                                </span>
                                {getPaymentStatusBadge(invoice.paymentStatus)}
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Due Amount</p>
                                <p className="text-lg font-bold text-red-600">
                                  {formatCurrency(dueAmount)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              {invoice.dueDate && (
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>
                                    Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                              )}
                              <div>
                                Total: {formatCurrency(invoice.totalCents)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Payment Form */}
          {selectedInvoices.size > 0 && (
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => {
                        const IconComponent = getIconComponent(method.type);
                        return (
                          <SelectItem key={method.code} value={method.code}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span>{method.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={format(paymentDate, 'yyyy-MM-dd')}
                    onChange={(e) => setPaymentDate(new Date(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Payment Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      id="paymentAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSetFullAmount}
                    >
                      Full Amount
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected invoices due: {formatCurrency(selectedDueCents)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentReference">Reference (Optional)</Label>
                  <Input
                    id="paymentReference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Check number, transaction ID, etc."
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                  <Input
                    id="paymentNotes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedInvoices.size === 0 || !paymentAmount || !paymentMethod}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Process Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

