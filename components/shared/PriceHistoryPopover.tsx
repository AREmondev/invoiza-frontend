"use client";

import { useState } from 'react';
import { Clock, DollarSign, User, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProductStore } from '@/store/useProductStore';
import { PriceHistoryEntry } from '@/types';
import { cn } from '@/lib/utils';

interface PriceHistoryPopoverProps {
  productId: string;
  variationId?: string;
  customerId?: string;
  currentPrice: number;
  unit: string;
  onPriceSelect?: (price: number) => void;
  trigger?: React.ReactNode;
}

export function PriceHistoryPopover({
  productId,
  variationId,
  customerId,
  currentPrice,
  unit,
  onPriceSelect,
  trigger,
}: PriceHistoryPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { getCustomerPriceHistory } = useProductStore();
  
  // Get price history for the specific customer and product (last 5 entries)
  const priceHistory = customerId && productId
    ? getCustomerPriceHistory(productId, customerId, variationId)
    : [];
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(price / 100).replace(/BDT/g, '৳').trim(); // Convert cents to taka
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePriceSelect = (price: number) => {
    if (onPriceSelect) {
      onPriceSelect(price);
      setIsOpen(false);
    }
  };

  const getPriceComparison = (historyPrice: number) => {
    const diff = historyPrice - currentPrice;
    const percentDiff = (diff / currentPrice) * 100;
    
    if (Math.abs(diff) < 0.01) return null; // Prices are essentially the same
    
    return {
      diff,
      percentDiff,
      isHigher: diff > 0,
      isLower: diff < 0,
    };
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Clock className="h-4 w-4" />
      Price History
    </Button>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">Price History</h4>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {customerId ? 'Customer-specific history' : 'Recent sales'}
              </span>
              <Badge variant="outline">Last 5 sales</Badge>
            </div>
          </div>

          <Separator />

          {/* Current Price */}
          <Card className="p-3 bg-accent/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current Price</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatPrice(currentPrice)}</div>
                <div className="text-xs text-muted-foreground">per {unit}</div>
              </div>
            </div>
          </Card>

          {/* Price History */}
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {priceHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No price history available</p>
                  {customerId && (
                    <p className="text-xs mt-1">No previous sales to this customer</p>
                  )}
                </div>
              ) : (
                priceHistory.map((entry, index) => {
                  const comparison = getPriceComparison(entry.unitPriceCents);
                  
                  return (
                    <Card
                      key={index}
                      className={cn(
                        "p-3 cursor-pointer hover:bg-accent/30 transition-colors",
                        onPriceSelect && "hover:border-primary"
                      )}
                      onClick={() => onPriceSelect && handlePriceSelect(entry.unitPriceCents)}
                    >
                      <div className="space-y-2">
                        {/* Price and Date */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {formatPrice(entry.unitPriceCents)}
                            </span>
                            {comparison && (
                              <Badge
                                variant={comparison.isLower ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {comparison.isLower ? '↓' : '↑'} {Math.abs(comparison.percentDiff).toFixed(1)}%
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(entry.invoiceDate)}
                          </div>
                        </div>

                        {/* Customer and Quantity */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Customer:</span>
                            <span>{entry.customerName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Qty:</span>
                            <span>{entry.quantity} {entry.unit}</span>
                          </div>
                        </div>

                        {/* Invoice Reference */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>Invoice:</span>
                          <Badge variant="outline" className="text-xs">
                            #{entry.invoiceId.slice(-6)}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {onPriceSelect && priceHistory.length > 0 && (
            <>
              <Separator />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  Click on any price above to apply it to the current item
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}