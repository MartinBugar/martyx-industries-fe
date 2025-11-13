/**
 * Discount Code API Service
 *
 * Handles discount code validation and application.
 * Works with both public promo codes and user-specific referral welcome bonuses.
 */

import { apiClient } from './apiClient';

// =========================================================================
// TYPE DEFINITIONS
// =========================================================================

export interface DiscountCodeDto {
  id: number;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  usageLimitPerCustomer?: number;
  firstPurchaseOnly: boolean;
  appliesTo: string;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;

  // Referral system fields
  userId?: number; // User-specific code (e.g., WELCOME123)
  referralId?: number; // Linked to referral
}

export interface DiscountValidationDto {
  valid: boolean;
  discountCodeId?: number;
  code?: string;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountAmount?: number;
  message?: string;
  description?: string;
}

export interface ValidateDiscountRequest {
  code: string;
  cartTotal: number;
  userId?: number;
}

// =========================================================================
// DISCOUNT CODE SERVICE
// =========================================================================

class DiscountCodeService {
  private readonly BASE_URL = '/api/discount-codes';

  /**
   * Validate a discount code
   * PUBLIC - can be called without authentication for guest checkout
   */
  async validateCode(code: string, cartTotal: number, userId?: number): Promise<DiscountValidationDto> {
    const params = new URLSearchParams({
      code,
      cartTotal: cartTotal.toString()
    });

    if (userId) {
      params.append('userId', userId.toString());
    }

    return apiClient.get<DiscountValidationDto>(`${this.BASE_URL}/validate?${params.toString()}`, {
      cache: false // Don't cache validation results
    });
  }

  /**
   * Get user's available discount codes (user-specific codes only)
   * Requires authentication
   */
  async getMyDiscountCodes(): Promise<DiscountCodeDto[]> {
    return apiClient.get<DiscountCodeDto[]>(`${this.BASE_URL}/my-codes`, {
      cache: true,
      cacheType: 'user-data'
    });
  }

  /**
   * Get discount code by code value
   * PUBLIC - for displaying discount info
   */
  async getDiscountByCode(code: string): Promise<DiscountCodeDto> {
    return apiClient.get<DiscountCodeDto>(`${this.BASE_URL}/code/${code}`);
  }
}

// =========================================================================
// EXPORTS
// =========================================================================

export const discountCodeService = new DiscountCodeService();
