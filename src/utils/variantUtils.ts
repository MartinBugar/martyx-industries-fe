/**
 * Variant utility functions
 * Shared helper functions for variant display and formatting
 */

export type VariantType = 'DIGITAL_ONLY' | 'PHYSICAL_ONLY' | 'HYBRID';
export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER' | 'DISCONTINUED' | 'BACKORDERED';

/**
 * Get short display text for variant type
 * @param type - The variant type
 * @returns Short display text (e.g., "Digital", "Physical", "Hybrid")
 */
export const getVariantTypeShort = (type: VariantType): string => {
    const badges: Record<VariantType, string> = {
        'DIGITAL_ONLY': 'Digital',
        'PHYSICAL_ONLY': 'Physical',
        'HYBRID': 'Hybrid'
    };
    return badges[type];
};

/**
 * Get display text for availability status with icon
 * @param status - The availability status
 * @returns Formatted text with icon (e.g., "✓ In Stock", "✗ Out of Stock")
 */
export const getAvailabilityText = (status: AvailabilityStatus): string => {
    const texts: Record<AvailabilityStatus, string> = {
        'IN_STOCK': '✓ In Stock',
        'LOW_STOCK': '⚠ Low Stock',
        'OUT_OF_STOCK': '✗ Out of Stock',
        'PRE_ORDER': '⏰ Pre-Order',
        'DISCONTINUED': '✗ Discontinued',
        'BACKORDERED': '⏰ Backordered'
    };
    return texts[status];
};

/**
 * Currency symbol mapping for common currencies
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'CZK': 'Kč',
    'PLN': 'zł',
    'HUF': 'Ft',
};

/**
 * Format price with currency symbol
 * @param price - The price amount (can be null/undefined)
 * @param currency - The currency code (e.g., "EUR", "USD") (can be null/undefined)
 * @returns Formatted price string (e.g., "29.99 €") or default "0.00 €" if invalid
 */
export const formatPrice = (price: number | null | undefined, currency: string | null | undefined): string => {
    // Handle null/undefined inputs
    if (price == null || currency == null) {
        return '0.00 €';
    }

    const formattedPrice = price.toFixed(2);
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${formattedPrice} ${symbol}`;
};

/**
 * Check if variant is out of stock
 * @param status - The availability status
 * @returns True if variant cannot be ordered (out of stock or discontinued)
 */
export const isOutOfStock = (status: AvailabilityStatus): boolean => {
    return status === 'OUT_OF_STOCK' || status === 'DISCONTINUED';
};

/**
 * Check if stock is low
 * @param stockQuantity - Current stock quantity (can be null/undefined)
 * @param threshold - Low stock threshold (default: 10)
 * @returns True if stock is low but available, false if null/undefined/negative
 */
export const isLowStock = (stockQuantity: number | null | undefined, threshold: number = 10): boolean => {
    // Handle null/undefined and negative values
    if (stockQuantity == null || stockQuantity < 0) {
        return false;
    }
    return stockQuantity > 0 && stockQuantity <= threshold;
};
