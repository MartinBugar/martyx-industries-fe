import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type { DiscountValidationDto } from '../types/discounts';

/**
 * Service for public discount code operations
 */

const jsonHeaders = () => defaultHeaders as HeadersInit;

export const discountService = {
  /**
   * Validates a discount code for use in checkout
   * @param code - Discount code
   * @param cartTotal - Total cart amount
   * @param userId - Optional user ID
   * @returns Validation result with discount details
   */
  async validateDiscount(
    code: string,
    cartTotal: number,
    userId?: number
  ): Promise<DiscountValidationDto> {
    const payload: { code: string; cartTotal: number; userId?: number } = {
      code,
      cartTotal
    };

    if (userId) {
      payload.userId = userId;
    }

    const resp = await fetch(`${API_BASE_URL}/api/discounts/validate`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });

    return await handleResponse(resp) as DiscountValidationDto;
  },

  /**
   * Retrieves public information about a discount code
   * @param code - Discount code
   * @returns Public discount code information
   */
  async getDiscountInfo(code: string): Promise<{
    code: string;
    description: string;
    discountType: string;
    discountValue: number;
    minimumOrderAmount: number;
    validFrom: string;
    validUntil: string;
  }> {
    const resp = await fetch(`${API_BASE_URL}/api/discounts/${encodeURIComponent(code)}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp);
  },
};
