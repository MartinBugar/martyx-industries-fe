import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type {
  ShippingCalculationRequestDto,
  ShippingCalculationResponseDto
} from '../types/shipping';

/**
 * Service for public shipping operations
 */

const jsonHeaders = () => defaultHeaders as HeadersInit;

export const shippingService = {
  /**
   * Calculates shipping costs for a destination and cart details
   * @param request - Shipping calculation request
   * @returns Available shipping methods with costs
   */
  async calculateShipping(
    request: ShippingCalculationRequestDto
  ): Promise<ShippingCalculationResponseDto> {
    const resp = await fetch(`${API_BASE_URL}/api/shipping/calculate`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(request),
    });

    return await handleResponse(resp) as ShippingCalculationResponseDto;
  },
};
