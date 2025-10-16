import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

export interface AdminReview {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewCreateRequest {
  productId: number;
  userId: number;
  rating: number;
  title?: string;
  comment: string;
}

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

export const adminReviewsService = {
  async getAllReviews(page: number = 0, size: number = 20, sortBy: string = 'createdAt', sortDir: string = 'DESC'): Promise<PageResponse<AdminReview>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir
    });

    const resp = await fetch(`${API_BASE_URL}/api/admin/reviews?${params}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    const data = await handleResponse(resp);

    // If backend returns paginated response, return it; otherwise wrap in page structure
    if (data && typeof data === 'object' && 'content' in data) {
      return data as PageResponse<AdminReview>;
    }

    // Fallback for non-paginated response (backward compatibility)
    return {
      content: Array.isArray(data) ? data : [],
      totalElements: Array.isArray(data) ? data.length : 0,
      totalPages: 1,
      size: Array.isArray(data) ? data.length : 0,
      number: 0,
      first: true,
      last: true
    };
  },

  async getReviewById(id: number): Promise<AdminReview> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/reviews/${id}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as AdminReview;
  },

  async createReview(payload: ReviewCreateRequest): Promise<AdminReview> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/reviews`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    }));
    return await handleResponse(resp) as AdminReview;
  },

  async updateReview(id: number, payload: Partial<ReviewCreateRequest>): Promise<AdminReview> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/reviews/${id}`, withLangHeaders({
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    }));
    return await handleResponse(resp) as AdminReview;
  },

  async deleteReview(id: number): Promise<void> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/reviews/${id}`, withLangHeaders({
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    }));
    if (resp.status === 204) return; // handle no content
    await handleResponse(resp);
  }
};
