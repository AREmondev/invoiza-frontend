"use client";

import { Clock, DollarSign, Package, Calendar, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from 'convex/react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/convex';
import { cn } from '@/lib/utils';

interface PriceQuantityHistoryProps {
  productId: string;
  variationId?: string;
  customerId?: string;
  currentPrice: number;
  currentQuantity: number;
  unit: string;
  onPriceSelect?: (price: number) => void;
  onQuantitySelect?: (quantity: number) => void;
}

export function PriceQuantityHistory({
  productId,
  variationId,
  customerId,
  currentPrice,
  currentQuantity,
  unit,
  onPriceSelect,
  onQuantitySelect,
}: PriceQuantityHistoryProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  // Fetch price history from Convex
  const historyData = useQuery(
    api.queries.priceHistory.getPriceHistory,
    productId && customerId && userEmail
      ? {
          productId: productId as any,
          customerId: customerId as any,
          variationId,
          userEmail,
          limit: 5,
        }
      : "skip"
  );

  // Convert history data to match expected format (convert timestamps to Dates)
  const history = (historyData || []).map((entry) => ({
    ...entry,
    invoiceDate: new Date(entry.invoiceDate),
  }));
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);
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
    }
  };

  const handleQuantitySelect = (quantity: number) => {
    if (onQuantitySelect) {
      onQuantitySelect(quantity);
    }
  };

  const getPriceComparison = (historyPrice: number) => {
    const diff = historyPrice - currentPrice;
    const percentDiff = (diff / currentPrice) * 100;
    
    if (Math.abs(diff) < 0.01) return null;
    
    return {
      diff,
      percentDiff,
      isHigher: diff > 0,
      isLower: diff < 0,
    };
  };

  const getQuantityComparison = (historyQuantity: number) => {
    const diff = historyQuantity - currentQuantity;
    const percentDiff = (diff / currentQuantity) * 100;
    
    if (Math.abs(diff) < 0.01) return null;
    
    return {
      diff,
      percentDiff,
      isHigher: diff > 0,
      isLower: diff < 0,
    };
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h4 className="font-semibold">Price & Quantity History</h4>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {customerId ? 'Customer-specific history' : 'Recent sales'}
          </span>
          <Badge variant="outline">Last 5 sales</Badge>
        </div>
      </div>

      <Separator />

      {/* Current Values */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 bg-accent/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Current Price</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatPrice(currentPrice)}</div>
              <div className="text-xs text-muted-foreground">per pcs</div>
            </div>
          </div>
        </Card>

        <Card className="p-3 bg-accent/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Current Qty</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">{currentQuantity}</div>
              <div className="text-xs text-muted-foreground">pcs</div>
            </div>
          </div>
        </Card>
      </div>

      {/* History */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No history available</p>
              {customerId && (
                <p className="text-xs mt-1">No previous sales to this customer</p>
              )}
            </div>
          ) : (
            history.map((entry, index) => {
              const priceComparison = getPriceComparison(entry.unitPriceCents);
              const quantityComparison = getQuantityComparison(entry.quantity);
              
              return (
                <Card
                  key={index}
                  className={cn(
                    "p-3 transition-colors",
                    (onPriceSelect || onQuantitySelect) && "cursor-pointer hover:bg-accent/30 hover:border-primary"
                  )}
                >
                  <div className="space-y-3">
                    {/* Date and Invoice */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.invoiceDate)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {entry.invoiceNumber || `Invoice #${entry.invoiceId.slice(-6)}`}
                      </Badge>
                    </div>

                    {/* Price Section */}
                    <div 
                      className={cn(
                        "p-2 rounded border",
                        onPriceSelect && "cursor-pointer hover:bg-accent/50"
                      )}
                      onClick={() => onPriceSelect && handlePriceSelect(entry.unitPriceCents)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {formatPrice(entry.unitPriceCents)}
                          </span>
                          {priceComparison && (
                            <Badge
                              variant={priceComparison.isLower ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {priceComparison.isLower ? '↓' : '↑'} {Math.abs(priceComparison.percentDiff).toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                        {onPriceSelect && (
                          <Badge variant="outline" className="text-xs">
                            Click to apply
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Quantity Section */}
                    <div 
                      className={cn(
                        "p-2 rounded border",
                        onQuantitySelect && "cursor-pointer hover:bg-accent/50"
                      )}
                      onClick={() => onQuantitySelect && handleQuantitySelect(entry.quantity)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {entry.quantity} pcs
                          </span>
                          {quantityComparison && (
                            <Badge
                              variant={quantityComparison.isLower ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {quantityComparison.isLower ? '↓' : '↑'} {Math.abs(quantityComparison.percentDiff).toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                        {onQuantitySelect && (
                          <Badge variant="outline" className="text-xs">
                            Click to apply
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{entry.customerName}</span>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {(onPriceSelect || onQuantitySelect) && history.length > 0 && (
        <>
          <Separator />
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">
              Click on price or quantity above to apply to current item
            </p>
          </div>
        </>
      )}
    </div>
  );
}

