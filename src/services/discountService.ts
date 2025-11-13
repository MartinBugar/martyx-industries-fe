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
    // Build query parameters
    const params = new URLSearchParams({
      code,
      cartTotal: cartTotal.toString()
    });

    if (userId) {
      params.append('userId', userId.toString());
    }

    const resp = await fetch(`${API_BASE_URL}/api/discount-codes/validate?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
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
    const resp = await fetch(`${API_BASE_URL}/api/discount-codes/code/${encodeURIComponent(code)}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp);
  },
};
