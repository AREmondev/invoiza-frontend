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

interface InvoicePaymentModalProps {
  invoice: any;
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

// Format currency helper function
const formatCurrency = (amountCents: number) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100).replace(/BDT/g, '৳').trim();
};

export function InvoicePaymentModal({
  invoice,
  open,
  onOpenChange,
  onPaymentSuccess,
}: InvoicePaymentModalProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Calculate due amount
  const dueAmountCents = invoice?.calculatedDueCents || invoice?.dueCents || 0;

  // Payment mutation
  const createPayment = useMutation(api.mutations.payments.createPayment);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && invoice) {
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      setPaymentDate(new Date());
    }
  }, [open, invoice]);

  const handleSetFullAmount = () => {
    setPaymentAmount((dueAmountCents / 100).toFixed(2));
  };

  const handleSubmit = async () => {
    if (!invoice) {
      toast({
        title: "Error",
        description: "Invoice information is missing",
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

    if (paymentAmountCents > dueAmountCents) {
      toast({
        title: "Error",
        description: `Payment amount cannot exceed due amount of ${formatCurrency(dueAmountCents)}`,
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createPayment({
        customerId: invoice.customerId,
        payments: [{
          invoiceId: invoice._id,
          amountCents: paymentAmountCents,
          paymentMethod,
          reference: paymentReference || undefined,
          notes: paymentNotes || undefined,
          paymentDate: paymentDate.getTime(),
        }],
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

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Make Payment
            <span className="text-muted-foreground font-normal">
              - {invoice.invoiceNumber}
            </span>
          </DialogTitle>
          <DialogDescription>
            Process payment for this invoice
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Invoice Summary */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{invoice.invoiceNumber}</span>
                </div>
                <Badge variant={invoice.type === 'sale' ? 'outline' : 'secondary'}>
                  {invoice.type === 'sale' ? 'Sale' : 'Purchase'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{invoice.billingName || invoice.customerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Invoice Date</p>
                  <p className="font-medium">
                    {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-medium">{formatCurrency(invoice.totalCents)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Amount</p>
                  <p className="font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(dueAmountCents)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Form */}
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="paymentAmount">Payment Amount *</Label>
                <div className="flex gap-2">
                  <Input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={dueAmountCents / 100}
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
                  Due amount: {formatCurrency(dueAmountCents)}
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

              <div className="space-y-2">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !paymentAmount || !paymentMethod}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Process Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

