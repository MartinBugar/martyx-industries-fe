import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import type { CustomerSegmentDto } from '../types/customer';
import type { User } from '../context/authTypes';

/**
 * Service for admin customer segment management operations
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

export const adminSegmentService = {
  /**
   * Get all customer segments
   * @returns List of all customer segments
   */
  async getAllSegments(): Promise<CustomerSegmentDto[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/segments`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as CustomerSegmentDto[];
  },

  /**
   * Get customer segment details by ID
   * @param id - Segment ID
   * @returns Segment details
   */
  async getSegmentById(id: number): Promise<CustomerSegmentDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/segments/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as CustomerSegmentDto;
  },

  /**
   * Create a new customer segment
   * @param dto - Segment creation data
   * @returns Created segment
   */
  async createSegment(dto: CustomerSegmentDto): Promise<CustomerSegmentDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/segments`, withLangHeaders({
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    }));

    return await handleResponse(resp) as CustomerSegmentDto;
  },

  /**
   * Update an existing customer segment
   * @param id - Segment ID
   * @param dto - Updated segment data
   * @returns Updated segment
   */
  async updateSegment(id: number, dto: CustomerSegmentDto): Promise<CustomerSegmentDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/segments/${id}`, withLangHeaders({
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    }));

    return await handleResponse(resp) as CustomerSegmentDto;
  },

  /**
   * Delete a customer segment
   * @param id - Segment ID
   * @returns Success response
   */
  async deleteSegment(id: number): Promise<{ message: string }> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/segments/${id}`, withLangHeaders({
      method: 'DELETE',
      headers: jsonHeaders(),
    }));

    return await handleResponse(resp);
  },

  /**
   * Get members (customers) of a specific segment
   * @param id - Segment ID
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Sort field (default: 'username')
   * @param sortDir - Sort direction (default: 'ASC')
   * @returns Paginated list of segment members
   */
  async getSegmentMembers(
    id: number,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'username',
    sortDir: string = 'ASC'
  ): Promise<PageResponse<User>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    });

    const resp = await fetch(`${API_BASE_URL}/api/admin/segments/${id}/members?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<User>;
  },

  /**
   * Recalculate membership for a specific segment
   * @param id - Segment ID
   * @returns Recalculated segment
   */
  async recalculateSegment(id: number): Promise<CustomerSegmentDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/segments/${id}/recalculate`, withLangHeaders({
      method: 'POST',
      headers: jsonHeaders(),
    }));

    return await handleResponse(resp) as CustomerSegmentDto;
  },

  /**
   * Recalculate membership for all segments
   * @returns List of recalculated segments
   */
  async recalculateAllSegments(): Promise<CustomerSegmentDto[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/segments/recalculate-all`, withLangHeaders({
      method: 'POST',
      headers: jsonHeaders(),
    }));

    return await handleResponse(resp) as CustomerSegmentDto[];
  },
};
