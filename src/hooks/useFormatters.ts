import { useTranslation } from 'react-i18next';

/**
 * Custom hook for formatting dates, currencies, and numbers with locale support
 * Automatically uses the current i18n language for formatting
 */
export const useFormatters = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  /**
   * Format a date with full month name
   * Example: January 12, 2025
   */
  const formatDate = (
    date: string | Date,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, options || {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Format a date with short month name
   * Example: Jan 12, 2025
   */
  const formatShortDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Format time
   * Example: 14:30
   */
  const formatTime = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Format date and time together
   * Example: Jan 12, 2025 14:30
   */
  const formatDateTime = (date: string | Date): string => {
    return `${formatShortDate(date)} ${formatTime(date)}`;
  };

  /**
   * Format currency with symbol
   * Example: €29.99
   */
  const formatCurrency = (
    amount: number,
    currency: string = 'EUR'
  ): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  };

  /**
   * Format number with locale-specific separators
   * Example: 1,234.56 (en) or 1 234,56 (sk)
   */
  const formatNumber = (
    num: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    return new Intl.NumberFormat(locale, options).format(num);
  };

  /**
   * Format percentage
   * Example: 15%
   */
  const formatPercentage = (value: number, decimals: number = 0): string => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  };

  /**
   * Format relative time
   * Example: "2 days ago", "in 3 hours"
   */
  const formatRelativeTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const diffInSeconds = Math.floor((dateObj.getTime() - Date.now()) / 1000);

    const intervals: { [key: string]: number } = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };

    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (Math.abs(interval) >= 1) {
        return rtf.format(interval, unit as Intl.RelativeTimeFormatUnit);
      }
    }

    return rtf.format(0, 'second');
  };

  /**
   * Format file size
   * Example: 1.5 MB
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  /**
   * Format compact number (1.2K, 1.5M, etc.)
   */
  const formatCompactNumber = (num: number): string => {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(num);
  };

  return {
    formatDate,
    formatShortDate,
    formatTime,
    formatDateTime,
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatRelativeTime,
    formatFileSize,
    formatCompactNumber,
    locale
  };
};
