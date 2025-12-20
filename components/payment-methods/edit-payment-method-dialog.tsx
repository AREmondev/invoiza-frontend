"use client";

import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/convex';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: any;
  onSuccess?: () => void;
}

type PaymentMethodType = "cash" | "bank" | "e_wallet" | "card" | "check" | "other";

export function EditPaymentMethodDialog({
  open,
  onOpenChange,
  method,
  onSuccess,
}: EditPaymentMethodDialogProps) {
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
  const [balance, setBalance] = useState('');
  
  const [isActive, setIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();

  const updateMethod = useMutation(api.mutations.paymentMethods.updatePaymentMethod);

  useEffect(() => {
    if (method) {
      setName(method.name || '');
      setCode(method.code || '');
      setType(method.type || 'cash');
      setDescription(method.description || '');
      setBankName(method.bankName || '');
      setAccountNumber(method.accountNumber || '');
      setAccountHolderName(method.accountHolderName || '');
      setBranchName(method.branchName || '');
      setEWalletType(method.eWalletType || '');
      setEWalletNumber(method.eWalletNumber || '');
      setCardType(method.cardType || '');
      setCardLastFour(method.cardLastFour || '');
      setBalance(method.balanceCents ? (method.balanceCents / 100).toFixed(2) : '0.00');
      setIsActive(method.isActive !== false);
    }
  }, [method]);

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

    setIsUpdating(true);
    try {
      await updateMethod({
        methodId: method._id,
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
        balanceCents: balance ? Math.round(parseFloat(balance) * 100) : undefined,
        isActive,
        userEmail,
      });

      toast({
        title: "Success",
        description: "Payment method updated successfully",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment method",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Payment Method</DialogTitle>
          <DialogDescription>
            Update payment method information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cash, Credit Card"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Code *</Label>
              <Input
                id="edit-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., cash, credit_card"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type *</Label>
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
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
                  <Label htmlFor="edit-bankName">Bank Name</Label>
                  <Input
                    id="edit-bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., Sonali Bank, Brac Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-accountNumber">Account Number</Label>
                  <Input
                    id="edit-accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-accountHolderName">Account Holder Name</Label>
                  <Input
                    id="edit-accountHolderName"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Account holder name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-branchName">Branch Name</Label>
                  <Input
                    id="edit-branchName"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Branch name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-balance">Current Balance</Label>
                  <Input
                    id="edit-balance"
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
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
                  <Label htmlFor="edit-eWalletType">E-Wallet Type</Label>
                  <Input
                    id="edit-eWalletType"
                    value={eWalletType}
                    onChange={(e) => setEWalletType(e.target.value)}
                    placeholder="e.g., bKash, Nagad, Rocket, PayPal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-eWalletNumber">E-Wallet Number</Label>
                  <Input
                    id="edit-eWalletNumber"
                    value={eWalletNumber}
                    onChange={(e) => setEWalletNumber(e.target.value)}
                    placeholder="E-wallet number"
                  />
                </div>
              </div>
            )}

            {/* Card specific fields */}
            {type === "card" && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Card Details</h4>
                <div className="space-y-2">
                  <Label htmlFor="edit-cardType">Card Type</Label>
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
                  <Label htmlFor="edit-cardLastFour">Last 4 Digits</Label>
                  <Input
                    id="edit-cardLastFour"
                    value={cardLastFour}
                    onChange={(e) => setCardLastFour(e.target.value)}
                    placeholder="Last 4 digits"
                    maxLength={4}
                  />
                </div>
              </div>
            )}

            {/* Cash balance */}
            {type === "cash" && (
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="edit-cashBalance">Current Cash Balance</Label>
                <Input
                  id="edit-cashBalance"
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <Label htmlFor="edit-active">Active</Label>
              <Switch
                id="edit-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || !name.trim() || !code.trim()}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Method"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
