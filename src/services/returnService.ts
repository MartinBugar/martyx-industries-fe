import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type {
  ReturnRequestDto,
  ReturnRequestCreateDto
} from '../types/returns';

/**
 * Service for public return request operations (RMA system)
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

export const returnService = {
  /**
   * Creates a new return request for a customer order
   * @param dto - Return request creation data
   * @returns Created return request
   */
  async createReturnRequest(dto: ReturnRequestCreateDto): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/returns/`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Retrieves all return requests for the authenticated user
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Sort field (default: 'createdAt')
   * @param sortDir - Sort direction (default: 'DESC')
   * @returns Paginated list of user's return requests
   */
  async getMyReturnRequests(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'DESC'
  ): Promise<PageResponse<ReturnRequestDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    });

    const resp = await fetch(`${API_BASE_URL}/api/returns/me?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<ReturnRequestDto>;
  },

  /**
   * Retrieves details of a specific return request
   * @param id - Return request ID
   * @returns Return request details
   */
  async getReturnDetails(id: number): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/returns/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Adds a message to a return request conversation
   * @param id - Return request ID
   * @param message - Message content
   * @returns Success response
   */
  async addMessage(id: number, message: string): Promise<{ message: string }> {
    const resp = await fetch(`${API_BASE_URL}/api/returns/${id}/messages`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ message }),
    });

    return await handleResponse(resp);
  },
};
