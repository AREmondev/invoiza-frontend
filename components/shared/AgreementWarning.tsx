"use client";

import { useState } from 'react';
import { AlertTriangle, Shield, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProductStore } from '@/store/useProductStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { AgreementCheckResult } from '@/types';
import { cn } from '@/lib/utils';

interface AgreementWarningProps {
  customerId: string;
  productId: string;
  variationId?: string;
  unit: string;
  quantity: number;
  enteredPrice: number;
  onAction: (action: 'force' | 'warn' | 'abort' | 'use-fake-price') => void;
  className?: string;
}

export function AgreementWarning({
  customerId,
  productId,
  variationId,
  unit,
  quantity,
  enteredPrice,
  onAction,
  className,
}: AgreementWarningProps) {
  const [showDialog, setShowDialog] = useState(false);
  
  const { checkPriceAgreement } = useProductStore();
  const { businessRules } = useSettingsStore();
  
  // Check the price agreement
  const agreementCheck = checkPriceAgreement(productId, enteredPrice * 100, quantity, unit, customerId, variationId);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount / 100).replace(/BDT/g, '৳').trim();
  };

  if (!agreementCheck.hasAgreement || !agreementCheck.isBelowMinimum) {
    return null; // No agreement violation
  }

  const handleAction = (action: 'force' | 'warn' | 'abort' | 'use-fake-price') => {
    onAction(action);
    setShowDialog(false);
  };

  const getAlertVariant = () => {
    switch (businessRules.minAgreementPriceAlert) {
      case 'block': return 'destructive';
      case 'warn': return 'default';
      case 'allow': return 'default';
      default: return 'default';
    }
  };

  const getAlertIcon = () => {
    switch (businessRules.minAgreementPriceAlert) {
      case 'block': return <XCircle className="h-4 w-4" />;
      case 'warn': return <AlertTriangle className="h-4 w-4" />;
      case 'allow': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (businessRules.minAgreementPriceAlert === 'block') {
    return (
      <>
        <Alert variant="destructive" className={cn(className)}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Price Agreement Violation</AlertTitle>
          <AlertDescription>
            The entered price {formatCurrency(enteredPrice)} is below the minimum agreed price of{' '}
            {formatCurrency(agreementCheck.minimumPriceCents || 0)} for this customer.
            This sale cannot proceed without approval.
          </AlertDescription>
        </Alert>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                Price Agreement Violation
              </DialogTitle>
              <DialogDescription>
                The entered price violates the minimum price agreement with this customer.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entered Price:</span>
                    <span className="font-medium">{formatCurrency(enteredPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Agreed Price:</span>
                    <span className="font-medium text-destructive">
                      {formatCurrency(agreementCheck.minimumPriceCents || 0)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Price Difference:</span>
                    <span className="text-destructive">
                      -{formatCurrency((agreementCheck.minimumPriceCents || 0) - enteredPrice)}
                    </span>
                  </div>
                </div>
              </Card>

              {agreementCheck.fakePriceRule && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Fake Price Rule Available</AlertTitle>
                  <AlertDescription>
                    A fake price rule is configured for this customer. You can use the fake price{' '}
                    {formatCurrency(agreementCheck.fakePriceRule.fakeUnitPriceCents)} for compliance.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleAction('abort')}>
                Cancel Sale
              </Button>
              
              {agreementCheck.fakePriceRule && (
                <Button variant="secondary" onClick={() => handleAction('use-fake-price')}>
                  Use Fake Price
                </Button>
              )}
              
              <Button variant="destructive" onClick={() => handleAction('force')}>
                Force Sale (Admin Only)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Alert variant={getAlertVariant()} className={cn(className)}>
        {getAlertIcon()}
        <AlertTitle>Price Agreement Warning</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            The entered price {formatCurrency(enteredPrice)} is below the minimum agreed price of{' '}
            {formatCurrency(agreementCheck.minimumPriceCents || 0)} for this customer.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDialog(true)}
            className="ml-4"
          >
            Review
          </Button>
        </AlertDescription>
      </Alert>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Price Agreement Warning
            </DialogTitle>
            <DialogDescription>
              The entered price is below the minimum agreed price with this customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entered Price:</span>
                  <span className="font-medium">{formatCurrency(enteredPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Agreed Price:</span>
                  <span className="font-medium text-warning">
                    {formatCurrency(agreementCheck.minimumPriceCents || 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Price Difference:</span>
                  <span className="text-warning">
                    -{formatCurrency((agreementCheck.minimumPriceCents || 0) - enteredPrice)}
                  </span>
                </div>
              </div>
            </Card>

            {agreementCheck.fakePriceRule && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Fake Price Rule Available</AlertTitle>
                <AlertDescription>
                  A fake price rule is configured for this customer. You can use the fake price{' '}
                  {formatCurrency(agreementCheck.fakePriceRule.fakeUnitPriceCents)} for compliance.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleAction('abort')}>
              Cancel
            </Button>
            
            <Button variant="secondary" onClick={() => handleAction('warn')}>
              Continue with Warning
            </Button>
            
            {agreementCheck.fakePriceRule && (
              <Button variant="default" onClick={() => handleAction('use-fake-price')}>
                Use Fake Price
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}