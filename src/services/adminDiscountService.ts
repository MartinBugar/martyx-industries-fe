import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type {
  DiscountCodeDto,
  DiscountCodeCreateDto,
  DiscountUsageStatsDto
} from '../types/discounts';

/**
 * Service for admin discount code management operations
 */

// Spring Data Page response interface
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

const jsonHeaders = () => defaultHeaders as HeadersInit;

export const adminDiscountService = {
  /**
   * Get all discount codes with pagination and optional active filter
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Sort field (default: 'createdAt')
   * @param sortDir - Sort direction (default: 'DESC')
   * @param active - Optional active status filter
   * @returns Paginated list of discount codes
   */
  async getAllDiscounts(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'DESC',
    active?: boolean
  ): Promise<PageResponse<DiscountCodeDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    });

    if (active !== undefined) {
      params.append('active', active.toString());
    }

    const resp = await fetch(`${API_BASE_URL}/api/admin/discounts?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<DiscountCodeDto>;
  },

  /**
   * Get discount code details by ID
   * @param id - Discount code ID
   * @returns Discount code details
   */
  async getDiscountById(id: number): Promise<DiscountCodeDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/discounts/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as DiscountCodeDto;
  },

  /**
   * Get discount code by code string
   * @param code - Discount code
   * @returns Discount code details
   */
  async getDiscountByCode(code: string): Promise<DiscountCodeDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/discounts/code/${encodeURIComponent(code)}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as DiscountCodeDto;
  },

  /**
   * Create a new discount code
   * @param dto - Discount code creation data
   * @returns Created discount code
   */
  async createDiscount(dto: DiscountCodeCreateDto): Promise<DiscountCodeDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/discounts`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    });

    return await handleResponse(resp) as DiscountCodeDto;
  },

  /**
   * Update an existing discount code
   * @param id - Discount code ID
   * @param dto - Updated discount code data
   * @returns Updated discount code
   */
  async updateDiscount(id: number, dto: DiscountCodeCreateDto): Promise<DiscountCodeDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/discounts/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    });

    return await handleResponse(resp) as DiscountCodeDto;
  },

  /**
   * Delete a discount code
   * @param id - Discount code ID
   * @returns Success response
   */
  async deleteDiscount(id: number): Promise<{ message: string }> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/discounts/${id}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp);
  },

  /**
   * Deactivate a discount code
   * @param id - Discount code ID
   * @returns Updated discount code
   */
  async deactivateDiscount(id: number): Promise<DiscountCodeDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/discounts/${id}/deactivate`, {
      method: 'PUT',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as DiscountCodeDto;
  },

  /**
   * Get usage statistics for a discount code
   * @param id - Discount code ID
   * @returns Usage statistics including order value and averages
   */
  async getUsageStats(id: number): Promise<DiscountUsageStatsDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/discounts/${id}/usage`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as DiscountUsageStatsDto;
  },

  /**
   * Get all active discount codes
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Sort field (default: 'createdAt')
   * @param sortDir - Sort direction (default: 'DESC')
   * @returns Paginated list of active discount codes
   */
  async getActiveDiscounts(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'DESC'
  ): Promise<PageResponse<DiscountCodeDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    });

    const resp = await fetch(`${API_BASE_URL}/api/admin/discounts/active?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<DiscountCodeDto>;
  },
};
