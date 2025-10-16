import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

export interface Shipping {
  id: number;
  orderId: number;
  orderNumber: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: string;
  shippingMethod?: string;
  shippingCost?: number;
  currency?: string;
  weightKg?: number;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  shippedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingStats {
  total: number;
  byStatus: {
    pending: number;
    processing: number;
    shipped: number;
    inTransit: number;
    delivered: number;
  };
}

export interface ShippingFilters {
  status?: string;
  search?: string;
}

/**
 * Admin service for managing shippings.
 */
export const adminShippingsService = {
  /**
   * Get all shippings with pagination and filtering.
   */
  async getAll(page: number = 0, size: number = 20, filters?: ShippingFilters): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const response = await fetch(
      `${API_BASE_URL}/api/admin/shippings?${params.toString()}`,
      withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      })
    );
    return await handleResponse(response);
  },

  /**
   * Get a single shipping by ID.
   */
  async getById(id: number): Promise<Shipping> {
    const response = await fetch(`${API_BASE_URL}/api/admin/shippings/${id}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(response);
  },

  /**
   * Get shipping by order ID.
   */
  async getByOrderId(orderId: number): Promise<Shipping> {
    const response = await fetch(`${API_BASE_URL}/api/admin/shippings/order/${orderId}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(response);
  },

  /**
   * Create a new shipping record.
   */
  async create(data: Partial<Shipping>): Promise<Shipping> {
    const response = await fetch(`${API_BASE_URL}/api/admin/shippings`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(data),
    }));
    return await handleResponse(response);
  },

  /**
   * Update a shipping record.
   */
  async update(id: number, data: Partial<Shipping>): Promise<Shipping> {
    const response = await fetch(`${API_BASE_URL}/api/admin/shippings/${id}`, withLangHeaders({
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(data),
    }));
    return await handleResponse(response);
  },

  /**
   * Delete a shipping record.
   */
  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/admin/shippings/${id}`, withLangHeaders({
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(response);
  },

  /**
   * Get shipping statistics.
   */
  async getStats(): Promise<ShippingStats> {
    const response = await fetch(`${API_BASE_URL}/api/admin/shippings/stats`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(response);
  },
};
