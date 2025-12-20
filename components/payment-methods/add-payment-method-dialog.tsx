"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/convex';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PaymentMethodType = "cash" | "bank" | "e_wallet" | "card" | "check" | "other";

export function AddPaymentMethodDialog({ open, onOpenChange }: AddPaymentMethodDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<PaymentMethodType>("cash");
  const [description, setDescription] = useState('');
  
  // Bank fields
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [branchName, setBranchName] = useState('');
  
  // E-wallet fields
  const [eWalletType, setEWalletType] = useState('');
  const [eWalletNumber, setEWalletNumber] = useState('');
  
  // Card fields
  const [cardType, setCardType] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');
  
  // Balance
  const [initialBalance, setInitialBalance] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();

  const createMethod = useMutation(api.mutations.paymentMethods.createPaymentMethod);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !code.trim()) {
      toast({
        title: "Error",
        description: "Name and code are required",
        variant: "destructive",
      });
      return;
    }

    // Validate type-specific required fields
    if (type === "bank" && !bankName.trim()) {
      toast({
        title: "Error",
        description: "Bank name is required for bank payment methods",
        variant: "destructive",
      });
      return;
    }

    if (type === "e_wallet" && (!eWalletType.trim() || !eWalletNumber.trim())) {
      toast({
        title: "Error",
        description: "E-wallet type and number are required for e-wallet payment methods",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createMethod({
        name: name.trim(),
        code: code.trim().toLowerCase().replace(/\s+/g, '_'),
        type,
        description: description.trim() || undefined,
        bankName: type === "bank" ? bankName.trim() || undefined : undefined,
        accountNumber: type === "bank" ? accountNumber.trim() || undefined : undefined,
        accountHolderName: type === "bank" ? accountHolderName.trim() || undefined : undefined,
        branchName: type === "bank" ? branchName.trim() || undefined : undefined,
        eWalletType: type === "e_wallet" ? eWalletType.trim() || undefined : undefined,
        eWalletNumber: type === "e_wallet" ? eWalletNumber.trim() || undefined : undefined,
        cardType: type === "card" ? cardType.trim() || undefined : undefined,
        cardLastFour: type === "card" ? cardLastFour.trim() || undefined : undefined,
        initialBalanceCents: initialBalance ? Math.round(parseFloat(initialBalance) * 100) : undefined,
        userEmail,
      });

      toast({
        title: "Success",
        description: "Payment method created successfully",
      });

      // Reset form
      setName('');
      setCode('');
      setType("cash");
      setDescription('');
      setBankName('');
      setAccountNumber('');
      setAccountHolderName('');
      setBranchName('');
      setEWalletType('');
      setEWalletNumber('');
      setCardType('');
      setCardLastFour('');
      setInitialBalance('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment method",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Create a new payment method. Name, code, and type are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cash, bKash, Sonali Bank"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., cash, bkash, sonali_bank"
                required
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (will be converted to lowercase with underscores)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={type} onValueChange={(value) => setType(value as PaymentMethodType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="e_wallet">E-Wallet</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description of the payment method"
                rows={2}
              />
            </div>

            {/* Bank-specific fields */}
            {type === "bank" && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Bank Details</h4>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., Sonali Bank, Brac Bank"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Account holder name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Branch name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialBalance">Initial Balance</Label>
                  <Input
                    id="initialBalance"
                    type="number"
                    step="0.01"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {/* E-wallet specific fields */}
            {type === "e_wallet" && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">E-Wallet Details</h4>
                <div className="space-y-2">
                  <Label htmlFor="eWalletType">E-Wallet Type *</Label>
                  <Input
                    id="eWalletType"
                    value={eWalletType}
                    onChange={(e) => setEWalletType(e.target.value)}
                    placeholder="e.g., bKash, Nagad, Rocket, PayPal"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eWalletNumber">E-Wallet Number *</Label>
                  <Input
                    id="eWalletNumber"
                    value={eWalletNumber}
                    onChange={(e) => setEWalletNumber(e.target.value)}
                    placeholder="E-wallet number"
                    required
                  />
                </div>
              </div>
            )}

            {/* Card specific fields */}
            {type === "card" && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Card Details</h4>
                <div className="space-y-2">
                  <Label htmlFor="cardType">Card Type</Label>
                  <Select value={cardType} onValueChange={setCardType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Credit">Credit Card</SelectItem>
                      <SelectItem value="Debit">Debit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardLastFour">Last 4 Digits</Label>
                  <Input
                    id="cardLastFour"
                    value={cardLastFour}
                    onChange={(e) => setCardLastFour(e.target.value)}
                    placeholder="Last 4 digits"
                    maxLength={4}
                  />
                </div>
              </div>
            )}

            {/* Cash initial balance */}
            {type === "cash" && (
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="cashInitialBalance">Initial Cash Balance</Label>
                <Input
                  id="cashInitialBalance"
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim() || !code.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Method"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
