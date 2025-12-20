"use client";

import { useState, useEffect } from 'react';
import { RotateCcw, Trash2, Package, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Invoice, InvoiceLineItem, Return, ReturnLineItem, ReturnStatus } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SaleReturnProps {
  invoice: Invoice;
  onReturnCreate: (returnData: {
    reason: string;
    lineItems: Array<{
      originalInvoiceLineItemId: string;
      quantity: number;
      reason: string;
    }>;
  }) => void;
  onCancel?: () => void;
  className?: string;
}

interface ReturnLineItemState {
  originalLineItem: InvoiceLineItem;
  returnQuantity: number;
  reason: string;
  isSelected: boolean;
}

export function SaleReturn({
  invoice,
  onReturnCreate,
  onCancel,
  className,
}: SaleReturnProps) {
  const [returnItems, setReturnItems] = useState<ReturnLineItemState[]>([]);
  const [globalReason, setGlobalReason] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    // Initialize return items from invoice line items
    const initialItems: ReturnLineItemState[] = invoice.lineItems
      .filter(item => !item.isReturned || item.returnedQuantity < item.quantity)
      .map(item => ({
        originalLineItem: item,
        returnQuantity: 0,
        reason: '',
        isSelected: false,
      }));
    setReturnItems(initialItems);
  }, [invoice]);

  const handleQuantityChange = (index: number, quantity: number) => {
    const item = returnItems[index];
    const maxQuantity = item.originalLineItem.quantity - (item.originalLineItem.returnedQuantity || 0);
    const clampedQuantity = Math.max(0, Math.min(quantity, maxQuantity));

    setReturnItems(prev => prev.map((itm, i) =>
      i === index
        ? { ...itm, returnQuantity: clampedQuantity, isSelected: clampedQuantity > 0 }
        : itm
    ));
  };

  const handleReasonChange = (index: number, reason: string) => {
    setReturnItems(prev => prev.map((itm, i) =>
      i === index ? { ...itm, reason } : itm
    ));
  };

  const handleRemoveItem = (index: number) => {
    setReturnItems(prev => prev.map((itm, i) =>
      i === index ? { ...itm, returnQuantity: 0, isSelected: false, reason: '' } : itm
    ));
  };

  const selectedItems = returnItems.filter(item => item.isSelected && item.returnQuantity > 0);
  const totalReturnAmount = selectedItems.reduce((sum, item) => {
    const lineTotal = item.originalLineItem.unitPriceCents * item.returnQuantity;
    return sum + lineTotal;
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount / 100).replace(/BDT/g, '৳').trim();
  };

  const handleSubmit = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to return');
      return;
    }

    // Validate that all selected items have reasons
    const itemsWithoutReason = selectedItems.filter(item => !item.reason.trim());
    if (itemsWithoutReason.length > 0) {
      alert('Please provide a reason for all return items');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmReturn = () => {
    const returnData = {
      reason: globalReason || 'Customer return',
      lineItems: selectedItems.map(item => ({
        originalInvoiceLineItemId: item.originalLineItem.id,
        quantity: item.returnQuantity,
        reason: item.reason || globalReason || 'Customer return',
      })),
    };

    onReturnCreate(returnData);
    setShowConfirmDialog(false);
  };

  const getAvailableQuantity = (item: ReturnLineItemState) => {
    return item.originalLineItem.quantity - (item.originalLineItem.returnedQuantity || 0);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Sale Return</h2>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>

      {/* Invoice Info */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4" />
              <span className="font-medium">Invoice: {invoice.invoiceNumber}</span>
              <Badge variant="outline">{invoice.type}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Date: {format(invoice.invoiceDate, 'MMM dd, yyyy')} • Total: {formatCurrency(invoice.totalCents)}
            </div>
          </div>
        </div>
      </Card>

      {/* Warning */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Return Restrictions</AlertTitle>
        <AlertDescription>
          You can only return items from this invoice. You cannot add new products that were not part of the original sale.
        </AlertDescription>
      </Alert>

      {/* Global Reason */}
      <Card className="p-4">
        <div className="space-y-2">
          <Label htmlFor="globalReason">Global Return Reason (Optional)</Label>
          <Textarea
            id="globalReason"
            value={globalReason}
            onChange={(e) => setGlobalReason(e.target.value)}
            placeholder="Enter a reason for this return (will be applied to all items if individual reasons are not provided)"
            rows={2}
          />
        </div>
      </Card>

      {/* Return Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Select Items to Return</h3>
          <Badge variant="outline">{selectedItems.length} item(s) selected</Badge>
        </div>

        {returnItems.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">All items from this invoice have been returned.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {returnItems.map((item, index) => {
              const availableQty = getAvailableQuantity(item);
              const isFullyReturned = availableQty === 0;

              return (
                <Card
                  key={item.originalLineItem.id}
                  className={cn(
                    "p-4",
                    item.isSelected && "border-primary bg-accent/50"
                  )}
                >
                  <div className="space-y-4">
                    {/* Item Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            Product ID: {item.originalLineItem.productId}
                          </span>
                          {item.originalLineItem.variationId && (
                            <Badge variant="outline">Variation</Badge>
                          )}
                          {isFullyReturned && (
                            <Badge variant="secondary">Fully Returned</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span>Original Qty:</span>
                            <span className="ml-2 font-medium">{item.originalLineItem.quantity}</span>
                          </div>
                          <div>
                            <span>Returned:</span>
                            <span className="ml-2 font-medium">{item.originalLineItem.returnedQuantity || 0}</span>
                          </div>
                          <div>
                            <span>Available:</span>
                            <span className="ml-2 font-medium text-primary">{availableQty}</span>
                          </div>
                          <div>
                            <span>Unit Price:</span>
                            <span className="ml-2 font-medium">{formatCurrency(item.originalLineItem.unitPriceCents)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!isFullyReturned && (
                      <>
                        <Separator />

                        {/* Return Quantity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`qty-${index}`}>Return Quantity</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id={`qty-${index}`}
                                type="number"
                                min="0"
                                max={availableQty}
                                value={item.returnQuantity}
                                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                                disabled={isFullyReturned}
                              />
                              <span className="text-sm text-muted-foreground">/ {availableQty} available</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(index, availableQty)}
                                disabled={isFullyReturned}
                              >
                                Return All
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(index, Math.floor(availableQty / 2))}
                                disabled={isFullyReturned}
                              >
                                Return Half
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`reason-${index}`}>Return Reason</Label>
                            <Input
                              id={`reason-${index}`}
                              value={item.reason}
                              onChange={(e) => handleReasonChange(index, e.target.value)}
                              placeholder="Enter reason for return"
                            />
                          </div>
                        </div>

                        {/* Return Amount */}
                        {item.returnQuantity > 0 && (
                          <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                            <span className="font-medium">Return Amount:</span>
                            <span className="text-lg font-semibold text-orange-600">
                              {formatCurrency(item.originalLineItem.unitPriceCents * item.returnQuantity)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {selectedItems.length > 0 && (
        <Card className="p-4 bg-accent/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Items to Return:</span>
              <span className="font-semibold">{selectedItems.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Return Amount:</span>
              <span className="text-xl font-bold text-orange-600">
                {formatCurrency(totalReturnAmount)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={selectedItems.length === 0}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Process Return
        </Button>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Return</DialogTitle>
            <DialogDescription>
              Please review the return details before processing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Return Reason</Label>
              <p className="text-sm">{globalReason || 'Customer return'}</p>
            </div>

            <div className="space-y-2">
              <Label>Items to Return ({selectedItems.length})</Label>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">Product: {item.originalLineItem.productId}</div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {item.returnQuantity} • Reason: {item.reason || globalReason || 'N/A'}
                        </div>
                      </div>
                      <div className="font-medium">
                        {formatCurrency(item.originalLineItem.unitPriceCents * item.returnQuantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            <div className="flex items-center justify-between font-semibold">
              <span>Total Return Amount:</span>
              <span className="text-lg text-orange-600">
                {formatCurrency(totalReturnAmount)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReturn}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

