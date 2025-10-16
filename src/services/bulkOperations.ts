import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

export interface BulkActionRequest {
  action: string;
  ids: number[];
  status?: string;
  active?: boolean;
}

export interface BulkActionResponse {
  action: string;
  total: number;
  successful: number;
  failed: number;
  errors: string[];
  message: string;
}

/**
 * Bulk operations service for admin entities.
 */
export const bulkService = {
  async users(action: string, ids: number[]): Promise<BulkActionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/bulk/users`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify({ action, ids })
    }));
    return await handleResponse(response);
  },

  async products(action: string, ids: number[], active?: boolean): Promise<BulkActionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/bulk/products`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify({ action, ids, active })
    }));
    return await handleResponse(response);
  },

  async orders(action: string, ids: number[], status?: string): Promise<BulkActionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/bulk/orders`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify({ action, ids, status })
    }));
    return await handleResponse(response);
  },

  async reviews(action: string, ids: number[]): Promise<BulkActionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/bulk/reviews`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify({ action, ids })
    }));
    return await handleResponse(response);
  },

  async contacts(action: string, ids: number[]): Promise<BulkActionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/bulk/contacts`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify({ action, ids })
    }));
    return await handleResponse(response);
  },

  async payments(action: string, ids: number[], status?: string): Promise<BulkActionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/bulk/payments`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify({ action, ids, status })
    }));
    return await handleResponse(response);
  },

  async shippings(action: string, ids: number[], status?: string): Promise<BulkActionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/bulk/shippings`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify({ action, ids, status })
    }));
    return await handleResponse(response);
  }
};
