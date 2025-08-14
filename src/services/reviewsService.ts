import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

export interface ReviewUser {
  id?: string | number;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
}

export interface Review {
  id?: string | number;
  productId?: string | number;
  userName?: string;
  username?: string;
  user?: ReviewUser;
  rating?: number;
  stars?: number;
  score?: number;
  text?: string;
  comment?: string;
  content?: string;
  message?: string;
  createdAt?: string;
  createdDate?: string;
  createdOn?: string;
  timestamp?: string;
}

export interface ReviewCreateRequest {
  rating: number;
  text: string;
  // send a duplicate field to be compatible with possible backend naming
  comment?: string;
}

const toReviewDisplay = (r: Review) => {
  const displayName = r.user?.name
    || [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ').trim()
    || r.userName
    || r.username
    || r.user?.email
    || 'Anonymous';

  const rating = (r.rating ?? r.stars ?? r.score ?? 0) as number;
  const text = (r.text ?? r.comment ?? r.content ?? r.message ?? '') as string;
  const created = (r.createdAt ?? r.createdDate ?? r.createdOn ?? r.timestamp ?? '') as string;

  return { ...r, displayName, rating, text, createdAt: created } as Review & { displayName: string; createdAt: string };
};

export const reviewsService = {
  async getReviews(productId: string | number): Promise<Array<Review & { displayName: string; createdAt: string }>> {
    const resp = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews`, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    const data = await handleResponse(resp) as Review[];
    return Array.isArray(data) ? data.map(toReviewDisplay) : [];
  },

  async addReview(productId: string | number, payload: ReviewCreateRequest): Promise<Review & { displayName: string; createdAt: string }> {
    // be generous with keys to match backend
    const body = { ...payload, comment: payload.comment ?? payload.text };
    const resp = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(body),
    });
    const data = await handleResponse(resp) as Review;
    return toReviewDisplay(data);
  },

  async deleteReview(productId: string | number, reviewId: string | number): Promise<void> {
    const resp = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    });
    // Handle 204 No Content explicitly to avoid JSON parsing errors
    if (resp.status === 204) {
      return;
    }
    // For any other response, reuse common handler (will throw on non-2xx)
    await handleResponse(resp);
  }
};
