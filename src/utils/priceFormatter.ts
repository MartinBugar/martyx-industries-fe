/**
 * Format price with currency symbol.
 */
export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
