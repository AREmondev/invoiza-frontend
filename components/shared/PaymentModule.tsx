"use client";

import { useState } from 'react';
import { DollarSign, CreditCard, Building2, Wallet, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Payment, PaymentStatus } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface PaymentModuleProps {
  invoiceId?: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  onPaymentAdd: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => void;
  onPaymentRemove?: (paymentId: string) => void;
  existingPayments?: Payment[];
  className?: string;
}

const paymentMethods: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', icon: <Wallet className="h-4 w-4" />, enabled: true },
  { id: 'credit_card', name: 'Credit Card', icon: <CreditCard className="h-4 w-4" />, enabled: true },
  { id: 'debit_card', name: 'Debit Card', icon: <CreditCard className="h-4 w-4" />, enabled: true },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: <Building2 className="h-4 w-4" />, enabled: true },
  { id: 'check', name: 'Check', icon: <DollarSign className="h-4 w-4" />, enabled: true },
  { id: 'mobile_payment', name: 'Mobile Payment', icon: <Wallet className="h-4 w-4" />, enabled: true },
  { id: 'other', name: 'Other', icon: <DollarSign className="h-4 w-4" />, enabled: true },
];

export function PaymentModule({
  invoiceId,
  totalAmount,
  paidAmount,
  dueAmount,
  onPaymentAdd,
  onPaymentRemove,
  existingPayments = [],
  className,
}: PaymentModuleProps) {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const handleAddPayment = () => {
    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }

    if (paymentAmount > dueAmount) {
      const confirmExceed = confirm(
        `Payment amount (${formatCurrency(paymentAmount)}) exceeds due amount (${formatCurrency(dueAmount)}). Continue?`
      );
      if (!confirmExceed) return;
    }

    const newPayment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
      invoiceId: invoiceId || '',
      amountCents: Math.round(paymentAmount),
      paymentMethod: paymentMethod,
      reference: paymentReference || undefined,
      notes: paymentNotes || undefined,
      paymentDate: paymentDate,
      status: 'pending' as PaymentStatus,
      processedBy: 'current-user', // Will be set from auth
    };

    onPaymentAdd(newPayment);

    // Reset form
    setPaymentAmount(0);
    setPaymentReference('');
    setPaymentNotes('');
    setPaymentDate(new Date());
    setShowAddPayment(false);
  };

  const handleRemovePayment = (paymentId: string) => {
    if (onPaymentRemove) {
      onPaymentRemove(paymentId);
    }
  };

  const getPaymentMethodIcon = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method?.icon || <DollarSign className="h-4 w-4" />;
  };

  const getPaymentMethodName = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method?.name || methodId;
  };

  const totalPayments = existingPayments.reduce((sum, payment) => sum + payment.amountCents, 0);
  const remainingDue = dueAmount - totalPayments;

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Payment Management</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddPayment(true)}
            disabled={remainingDue <= 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-muted/50">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
          </Card>
          <Card className="p-4 bg-green-50">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPayments)}</p>
            </div>
          </Card>
          <Card className={cn("p-4", remainingDue > 0 ? "bg-orange-50" : "bg-green-50")}>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Remaining Due</p>
              <p className={cn("text-2xl font-bold", remainingDue > 0 ? "text-orange-600" : "text-green-600")}>
                {formatCurrency(remainingDue)}
              </p>
            </div>
          </Card>
        </div>

        {/* Payment Methods Quick Add */}
        <div className="space-y-2">
          <Label>Quick Add Payment</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {paymentMethods.filter(m => m.enabled).map((method) => (
              <Button
                key={method.id}
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  setPaymentMethod(method.id);
                  setPaymentAmount(Math.min(remainingDue, remainingDue));
                  setShowAddPayment(true);
                }}
                disabled={remainingDue <= 0}
              >
                {method.icon}
                {method.name}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Existing Payments */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Payment History</Label>
            <Badge variant="outline">{existingPayments.length} payment(s)</Badge>
          </div>
          
          {existingPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No payments recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {existingPayments.map((payment) => (
                <Card key={payment.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 bg-accent rounded">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{getPaymentMethodName(payment.paymentMethod)}</span>
                          <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div>{format(payment.paymentDate, 'MMM dd, yyyy')}</div>
                          {payment.reference && (
                            <div>Ref: {payment.reference}</div>
                          )}
                          {payment.notes && (
                            <div className="truncate max-w-xs">{payment.notes}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(payment.amountCents)}
                        </div>
                      </div>
                      {onPaymentRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePayment(payment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Payment Dialog */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Record a payment for this invoice. Remaining due: {formatCurrency(remainingDue)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.filter(m => m.enabled).map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        {method.icon}
                        {method.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Amount</Label>
              <Input
                id="paymentAmount"
                type="number"
                min="0"
                step="0.01"
                value={(paymentAmount / 100).toFixed(2)}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) * 100 || 0)}
                placeholder="0.00"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(remainingDue)}
                >
                  Use Full Amount
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(Math.round(remainingDue / 2))}
                >
                  Use Half
                </Button>
              </div>
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
                placeholder="Additional notes about this payment"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPayment(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment} disabled={paymentAmount <= 0}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

