import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

export interface Payment {
  id: number;
  paymentReference: string;
  orderId: number;
  orderNumber: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  provider: string;
  status: string;
  providerStatus?: string;
  transactionId?: string;
  payerId?: string;
  payerEmail?: string;
  paymentUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PaymentStats {
  total: number;
  byStatus: {
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
  };
  byProvider: {
    paypal: number;
    creditCard: number;
    bankTransfer: number;
  };
}

export interface PaymentFilters {
  status?: string;
  provider?: string;
  search?: string;
}

/**
 * Admin service for managing payments.
 */
export const adminPaymentsService = {
  /**
   * Get all payments with pagination and filtering.
   */
  async getAll(page: number = 0, size: number = 20, filters?: PaymentFilters): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (filters?.status) params.append('status', filters.status);
    if (filters?.provider) params.append('provider', filters.provider);
    if (filters?.search) params.append('search', filters.search);

    const response = await fetch(
      `${API_BASE_URL}/api/admin/payments?${params.toString()}`,
      withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      })
    );
    return await handleResponse(response);
  },

  /**
   * Get a single payment by ID.
   */
  async getById(id: number): Promise<Payment> {
    const response = await fetch(`${API_BASE_URL}/api/admin/payments/${id}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(response);
  },

  /**
   * Update a payment.
   */
  async update(id: number, data: Partial<Payment>): Promise<Payment> {
    const response = await fetch(`${API_BASE_URL}/api/admin/payments/${id}`, withLangHeaders({
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(data),
    }));
    return await handleResponse(response);
  },

  /**
   * Delete a payment.
   */
  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/admin/payments/${id}`, withLangHeaders({
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(response);
  },

  /**
   * Get payment statistics.
   */
  async getStats(): Promise<PaymentStats> {
    const response = await fetch(`${API_BASE_URL}/api/admin/payments/stats`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(response);
  },
};
