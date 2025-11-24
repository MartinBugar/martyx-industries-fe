/**
 * Customer Segmentation and Metrics Type Definitions
 * Corresponds to backend DTOs for customer analytics, shopping carts, and segmentation
 */

/**
 * Cart Status enum
 */
export const CartStatus = {
  ACTIVE: 'ACTIVE',
  ABANDONED: 'ABANDONED',
  RECOVERED: 'RECOVERED',
  CONVERTED: 'CONVERTED',
  EXPIRED: 'EXPIRED'
} as const;
export type CartStatus = typeof CartStatus[keyof typeof CartStatus];

/**
 * Segment Type enum
 */
export const SegmentType = {
  BEHAVIORAL: 'BEHAVIORAL',
  DEMOGRAPHIC: 'DEMOGRAPHIC',
  VALUE_BASED: 'VALUE_BASED',
  LIFECYCLE: 'LIFECYCLE'
} as const;
export type SegmentType = typeof SegmentType[keyof typeof SegmentType];

/**
 * Customer Tier enum
 */
export const CustomerTier = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM'
} as const;
export type CustomerTier = typeof CustomerTier[keyof typeof CustomerTier];

/**
 * Customer Status enum
 */
export const CustomerStatus = {
  NEW: 'NEW',
  ACTIVE: 'ACTIVE',
  AT_RISK: 'AT_RISK',
  CHURNED: 'CHURNED',
  VIP: 'VIP'
} as const;
export type CustomerStatus = typeof CustomerStatus[keyof typeof CustomerStatus];

/**
 * Cart Item DTO - matches backend CartItemDto
 */
export interface CartItemDto {
  id: number;
  masterProductId: number;
  variantId: number;
  masterProductName: string;
  variantName: string;
  quantity: number;
  priceWithVat: number;
  subtotal: number;
  imageUrl?: string;
  thumbnailUrl?: string; // Optimized thumbnail for cart display
}

/**
 * Shopping Cart data
 * Shopping cart information for abandoned cart recovery and conversion tracking
 */
export interface ShoppingCartDto {
  id: number;
  userId?: number;
  sessionId?: string;
  items: CartItemDto[]; // NEW: List of cart items (replaces cart_items JSON string)
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
  lastActivityAt?: string; // ISO date string
  isAbandoned: boolean;
  recoveryEmailCount?: number;

  // Legacy fields for backward compatibility (abandoned cart admin)
  email?: string;
  cart_items?: string; // DEPRECATED: JSON array of cart items
  total_items?: number;
  estimated_total?: number;
  cart_status?: string; // CartStatus enum value
  last_activity_at?: string; // ISO date string
  abandoned_at?: string; // ISO date string
  abandoned_reason?: string; // HIGH_SHIPPING, NO_PAYMENT_METHOD, JUST_BROWSING, PRICE, OUT_OF_STOCK, OTHER
  recovery_email_sent_at?: string; // ISO date string
  recovery_click_count?: number;
  recovered_at?: string; // ISO date string
  converted_at?: string; // ISO date string
  order_id?: number;
  order_number?: string;
  recovery_discount_code?: string;
  ip_address?: string;
  user_agent?: string;
  referrer_url?: string;
  landing_page?: string;
  created_at?: string; // ISO date string
  updated_at?: string; // ISO date string
  expires_at?: string; // ISO date string
}

/**
 * Customer Segment information
 * Customer segment for targeted marketing and analytics
 */
export interface CustomerSegmentDto {
  id: number;
  segment_name: string;
  segment_code: string;
  segment_type: string; // SegmentType enum value
  criteria: string; // JSON object with segment criteria
  description?: string;
  is_automatic?: boolean;
  auto_update_enabled?: boolean;
  member_count?: number;
  last_calculated_at?: string; // ISO date string
  is_active: boolean;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Customer Segment Member (if needed for member lists)
 */
export interface CustomerSegmentMemberDto {
  segment_id: number;
  user_id: number;
  added_at: string; // ISO date string
  is_active: boolean;
}

/**
 * Customer Metrics
 * Customer lifetime value, tier, and engagement metrics
 */
export interface CustomerMetricsDto {
  user_id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  // Lifetime metrics
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  lifetime_value: number;
  // Recent activity
  last_order_date?: string; // ISO date string
  days_since_last_order?: number;
  first_order_date?: string; // ISO date string
  customer_age_days?: number;
  // Engagement
  total_page_views?: number;
  total_sessions?: number;
  conversion_rate?: number;
  cart_abandonment_rate?: number;
  abandoned_carts_count?: number;
  recovered_carts_count?: number;
  // Tier and segmentation
  customer_tier: string; // CustomerTier enum value
  customer_status: string; // CustomerStatus enum value
  segments?: string[];
  // Product preferences
  favorite_categories?: string[];
  most_purchased_products?: string[];
  total_returns?: number;
  return_rate?: number;
  calculated_at: string; // ISO date string
}
