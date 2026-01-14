/**
 * Admin Formatting Utilities
 *
 * Consolidates formatting functions used across admin pages
 * to reduce duplication and ensure consistency.
 */

/**
 * Format a date/datetime value to localized string.
 * Handles various input types (string, Date, null).
 */
export const formatDateTime = (value: unknown, options?: Intl.DateTimeFormatOptions): string => {
  if (!value) return '—';

  const d = value instanceof Date ? value : new Date(String(value));

  if (isNaN(d.getTime())) return '—';

  return d.toLocaleString('sk-SK', options || {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date only (without time).
 */
export const formatDate = (value: unknown): string => {
  if (!value) return '—';

  const d = value instanceof Date ? value : new Date(String(value));

  if (isNaN(d.getTime())) return '—';

  return d.toLocaleDateString('sk-SK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Format time only (without date).
 */
export const formatTime = (value: unknown): string => {
  if (!value) return '—';

  const d = value instanceof Date ? value : new Date(String(value));

  if (isNaN(d.getTime())) return '—';

  return d.toLocaleTimeString('sk-SK', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format money/currency value.
 */
export const formatMoney = (
  amount: number | string | undefined | null,
  currency: string = 'EUR'
): string => {
  if (amount == null || amount === '') return '—';

  const num = typeof amount === 'number' ? amount : Number(amount);

  if (isNaN(num)) return '—';

  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format price value (simpler version without full locale formatting).
 */
export const formatPrice = (
  amount: number | string | undefined | null,
  currency: string = '€'
): string => {
  if (amount == null || amount === '') return '—';

  const num = typeof amount === 'number' ? amount : Number(amount);

  if (isNaN(num)) return '—';

  return `${num.toFixed(2)} ${currency}`;
};

/**
 * Format percentage value.
 */
export const formatPercent = (
  value: number | string | undefined | null,
  decimals: number = 1
): string => {
  if (value == null || value === '') return '—';

  const num = typeof value === 'number' ? value : Number(value);

  if (isNaN(num)) return '—';

  return `${num.toFixed(decimals)}%`;
};

/**
 * Convert datetime to HTML datetime-local input format.
 */
export const toDateTimeLocalStr = (value?: string | Date): string => {
  if (!value) return '';

  const d = value instanceof Date ? value : new Date(value);

  if (isNaN(d.getTime())) return '';

  // Format: YYYY-MM-DDTHH:mm
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Count total items in order items array.
 */
export const getOrderItemsCount = <T extends { quantity?: number }>(items: T[]): number => {
  if (!items?.length) return 0;
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
};

/**
 * Calculate total amount from order items.
 */
export const getOrderTotalAmount = <T extends { quantity?: number; unitPrice?: number }>(
  items: T[],
  fallbackAmount?: number
): number => {
  if (!items?.length) return fallbackAmount || 0;
  return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
};

/**
 * Truncate text with ellipsis.
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Format file size in human readable format.
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
};
