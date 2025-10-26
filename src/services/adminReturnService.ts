import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type {
  ReturnRequestDto,
  ReturnRequestUpdateDto,
  RmaApprovalDto
} from '../types/returns';

/**
 * Service for admin return request (RMA) management operations
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

export const adminReturnService = {
  /**
   * Get all return requests with pagination and optional filters
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Sort field (default: 'createdAt')
   * @param sortDir - Sort direction (default: 'DESC')
   * @param status - Optional status filter
   * @param requestType - Optional request type filter
   * @returns Paginated list of return requests
   */
  async getAllReturns(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'DESC',
    status?: string,
    requestType?: string
  ): Promise<PageResponse<ReturnRequestDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    });

    if (status) {
      params.append('status', status);
    }

    if (requestType) {
      params.append('requestType', requestType);
    }

    const resp = await fetch(`${API_BASE_URL}/api/admin/returns?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<ReturnRequestDto>;
  },

  /**
   * Get return request details by ID
   * @param id - Return request ID
   * @returns Return request details
   */
  async getReturnById(id: number): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Update a return request
   * @param id - Return request ID
   * @param dto - Update data
   * @returns Updated return request
   */
  async updateReturn(id: number, dto: ReturnRequestUpdateDto): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Approve a return request
   * @param id - Return request ID
   * @param dto - Approval data
   * @returns Updated return request
   */
  async approveReturn(id: number, dto: RmaApprovalDto): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}/approve`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Reject a return request
   * @param id - Return request ID
   * @param reason - Rejection reason
   * @returns Updated return request
   */
  async rejectReturn(id: number, reason: string): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}/reject`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ reason }),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Mark return as received
   * @param id - Return request ID
   * @returns Updated return request
   */
  async markAsReceived(id: number): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}/received`, {
      method: 'POST',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Inspect a returned product
   * @param id - Return request ID
   * @param payload - Inspection data (passed: boolean, notes?: string)
   * @returns Updated return request
   */
  async inspectReturn(id: number, payload: { passed: boolean; notes?: string }): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}/inspect`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Process refund for a return
   * @param id - Return request ID
   * @param payload - Refund data (amount: number, refundMethod: string)
   * @returns Updated return request
   */
  async processRefund(id: number, payload: { amount: number; refundMethod: string }): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}/refund`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Complete a return request
   * @param id - Return request ID
   * @returns Updated return request
   */
  async completeReturn(id: number): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}/complete`, {
      method: 'POST',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Get return statistics
   * @returns Return statistics
   */
  async getReturnStats(): Promise<Record<string, any>> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/stats`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp);
  },
};
