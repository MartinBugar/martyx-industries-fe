/**
 * Discount Code and Promotional Campaign Type Definitions
 * Corresponds to backend DTOs for discount codes and marketing campaigns
 */

/**
 * Discount Type enum
 */
export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  FREE_SHIPPING: 'FREE_SHIPPING'
} as const;
export type DiscountType = typeof DiscountType[keyof typeof DiscountType];

/**
 * Applies To enum (discount applicability)
 */
export const AppliesTo = {
  ALL: 'ALL',
  SPECIFIC_PRODUCTS: 'SPECIFIC_PRODUCTS',
  SPECIFIC_CATEGORIES: 'SPECIFIC_CATEGORIES',
  MINIMUM_ORDER: 'MINIMUM_ORDER'
} as const;
export type AppliesTo = typeof AppliesTo[keyof typeof AppliesTo];

/**
 * Campaign Type enum
 */
export const CampaignType = {
  SEASONAL: 'SEASONAL',
  FLASH_SALE: 'FLASH_SALE',
  CLEARANCE: 'CLEARANCE',
  NEW_CUSTOMER: 'NEW_CUSTOMER',
  LOYALTY: 'LOYALTY',
  BLACK_FRIDAY: 'BLACK_FRIDAY',
  CHRISTMAS: 'CHRISTMAS',
  OTHER: 'OTHER'
} as const;
export type CampaignType = typeof CampaignType[keyof typeof CampaignType];

/**
 * Discount Code details
 * Complete discount code information including usage and constraints
 */
export interface DiscountCodeDto {
  id: number;
  code: string;
  discount_type: string; // DiscountType enum value
  discount_value: number;
  applies_to: string; // AppliesTo enum value
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  applicable_product_ids?: number[];
  applicable_category_ids?: number[];
  applicable_master_product_ids?: number[];
  usage_limit?: number;
  usage_count: number;
  usage_limit_per_customer?: number;
  first_purchase_only?: boolean;
  valid_from: string; // ISO date string
  valid_until?: string; // ISO date string
  is_active: boolean;
  description?: string;
  internal_notes?: string;
  created_by?: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Discount Code creation DTO
 * Request DTO for creating new discount codes
 */
export interface DiscountCodeCreateDto {
  code: string;
  discount_type: string; // DiscountType enum value
  discount_value: number;
  applies_to: string; // AppliesTo enum value
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  applicable_product_ids?: number[];
  applicable_category_ids?: number[];
  applicable_master_product_ids?: number[];
  usage_limit?: number;
  usage_limit_per_customer?: number;
  first_purchase_only?: boolean;
  valid_from: string; // ISO date string
  valid_until?: string; // ISO date string
  is_active?: boolean;
  description?: string;
  internal_notes?: string;
}

/**
 * Discount Code validation result
 * Response DTO containing validation status and calculated discount
 */
export interface DiscountValidationDto {
  valid: boolean;
  discount_code_id?: number;
  code?: string;
  discount_type?: string; // DiscountType enum value
  discount_value?: number;
  calculated_discount_amount?: number;
  final_total?: number;
  free_shipping?: boolean;
  error_code?: string; // EXPIRED, USAGE_LIMIT_REACHED, MIN_ORDER_NOT_MET, etc.
  error_message?: string;
  validation_errors?: string[];
}

/**
 * Discount Usage Statistics
 * Analytics data for discount code usage and performance
 */
export interface DiscountUsageStatsDto {
  discountCodeId: number;
  code: string;
  totalUsages: number;
  uniqueUsers: number;
  totalDiscountAmount: number;
  totalOrderValue: number;
  averageDiscountAmount: number;
  averageOrderValue: number;
}

/**
 * Promotional Campaign details
 * Marketing campaign information with performance metrics
 */
export interface PromotionalCampaignDto {
  id: number;
  campaign_name: string;
  campaign_type: string; // CampaignType enum value
  start_date: string; // ISO date string
  end_date?: string; // ISO date string
  is_active: boolean;
  discount_code_ids?: number[];
  target_revenue?: number;
  target_orders?: number;
  target_new_customers?: number;
  actual_revenue?: number;
  actual_orders?: number;
  actual_new_customers?: number;
  actual_discount_amount?: number;
  marketing_channels?: string[];
  description?: string;
  internal_notes?: string;
  created_by?: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  // Calculated fields
  revenue_progress_percentage?: number;
  orders_progress_percentage?: number;
  roi?: number; // Return on Investment
}
