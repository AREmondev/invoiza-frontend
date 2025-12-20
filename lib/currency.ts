/**
 * Currency configuration for the application
 * Set to BDT (Bangladesh Taka) for Bangladesh market
 */

export const CURRENCY = 'BDT' as const;
export const CURRENCY_SYMBOL = '৳' as const;

/**
 * Format amount in cents to currency string
 * @param amountCents - Amount in cents (smallest currency unit)
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amountCents: number,
  options?: {
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  }
): string {
  const {
    currency = CURRENCY,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true,
  } = options || {};

  const amount = amountCents / 100;
  
  const formatted = new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  // Replace currency code with symbol if needed
  if (showSymbol && currency === 'BDT') {
    return formatted.replace(/BDT/g, CURRENCY_SYMBOL).trim();
  }

  return formatted;
}

/**
 * Parse currency string to cents
 * @param value - Currency string or number
 * @returns Amount in cents
 */
export function parseCurrency(value: string | number): number {
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }
  
  // Remove currency symbols and spaces
  const cleaned = value.replace(/[৳$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) {
    return 0;
  }
  
  return Math.round(parsed * 100);
}

