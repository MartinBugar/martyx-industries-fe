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
 * Format price with currency symbol
 * @param price - The price amount
 * @param currency - The currency code (e.g., "EUR", "USD")
 * @returns Formatted price string (e.g., "29.99 €")
 */
export const formatPrice = (price: number, currency: string): string => {
    const formattedPrice = price.toFixed(2);
    const symbol = currency === 'EUR' ? '€' : currency;
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
 * @param stockQuantity - Current stock quantity
 * @param threshold - Low stock threshold (default: 10)
 * @returns True if stock is low but available
 */
export const isLowStock = (stockQuantity: number, threshold: number = 10): boolean => {
    return stockQuantity > 0 && stockQuantity <= threshold;
};
