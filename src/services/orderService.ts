import { API_BASE_URL, defaultHeaders } from './apiUtils';
import { apiClient } from './apiClient';

// ===== TYPE DEFINITIONS =====

export interface OrderItem {
  variantId: number;
  productName: string;
  variantName?: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
  billingAddress: Address;
  shippingAddress: Address;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  invoiceUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TrackingEvent {
  date: string;
  location: string;
  description: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery: string;
  trackingEvents: TrackingEvent[];
}

export interface ReorderResponse {
  success: boolean;
  newOrderId?: number;
  unavailableItems?: {
    variantId: number;
    productName: string;
    reason: string;
  }[];
}

export interface CancelOrderResponse {
  success: boolean;
  refundAmount?: number;
  message: string;
}

export interface ReturnItem {
  variantId: number;
  quantity: number;
  reason: string;
}

export interface ReturnOrderRequest {
  items: ReturnItem[];
  refundMethod: 'original' | 'store_credit';
}

export interface ReturnOrderResponse {
  success: boolean;
  returnId: number;
  returnLabel: string;
  message: string;
}

/**
 * Modular download link for configured products.
 * Supports BASE (base model) and OPTION (selected configuration options) download types.
 */
export interface ModularDownloadLink {
  id: number;
  downloadType: 'BASE' | 'OPTION' | 'LEGACY';
  slotKey?: string;
  optionKey?: string;
  displayName: string;
  fileName: string;
  fileSize?: number;
  downloadToken: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt?: string;
  isValid: boolean;
}

export interface OrderItemDownloadsResponse {
  orderItemId: number;
  productName: string;
  downloads: ModularDownloadLink[];
}

export const orderService = {
  /**
   * Get modular downloads for an order item (configured products).
   * Returns BASE download (if exists) and OPTION downloads for each selected configuration.
   */
  getOrderItemDownloads: async (orderId: number | string, orderItemId: number | string): Promise<OrderItemDownloadsResponse> => {
    return await apiClient.get<OrderItemDownloadsResponse>(
      `/api/orders/${orderId}/items/${orderItemId}/downloads`
    );
  },

  /**
   * Download a file using modular download token.
   * This is used for configured products with multiple download files.
   */
  downloadByToken: async (token: string, displayName?: string): Promise<void> => {
    const url = `${API_BASE_URL}/api/download/${encodeURIComponent(token)}`;

    const headers: Record<string, string> = {};
    const auth = defaultHeaders['Authorization'];
    if (auth) headers['Authorization'] = auth;

    const response = await fetch(url, {
      method: 'GET',
      headers: headers as HeadersInit,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete defaultHeaders['Authorization'];
        window.dispatchEvent(new CustomEvent('auth:logout', {
          detail: { reason: 'api_error' }
        }));
      }
      let errorMessage = `Failed to download file (${response.status})`;
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // Ignore body parsing errors
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();

    // Determine filename from Content-Disposition header or displayName
    const cd = response.headers.get('content-disposition') || response.headers.get('Content-Disposition');
    let filename = displayName ? `${displayName}.zip` : 'download.zip';

    if (cd) {
      const match = cd.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
      if (match && match[1]) {
        let fn = match[1].replace(/"/g, '');
        try { fn = decodeURIComponent(fn); } catch { /* ignore */ }
        filename = fn;
      }
    }

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  downloadProduct: async (orderId: number | string, productId: number | string, productName?: string): Promise<void> => {
    const url = `${API_BASE_URL}/api/orders/${orderId}/items/${productId}/download`;

    // Build headers without forcing Content-Type for binary response
    const headers: Record<string, string> = {};
    const auth = defaultHeaders['Authorization'];
    if (auth) headers['Authorization'] = auth;

    const response = await fetch(url, {
      method: 'GET',
      headers: headers as HeadersInit,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Mirror apiUtils 401 handling
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete defaultHeaders['Authorization'];
        window.dispatchEvent(new CustomEvent('auth:logout', {
          detail: { reason: 'api_error' }
        }));
      }
      let errorMessage = `Failed to download product (${response.status})`;
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // Ignore body parsing errors; use generic message
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();

    // Determine filename from Content-Disposition header if present, otherwise use product name
    const cd = response.headers.get('content-disposition') || response.headers.get('Content-Disposition');
    let filename = `product-${productId}.zip`;
    
    if (cd) {
      const match = cd.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
      if (match && match[1]) {
        let fn = match[1].replace(/"/g, '');
        try { fn = decodeURIComponent(fn); } catch { /* ignore decode errors */ }
        filename = fn;
      }
    } else if (productName) {
      // Use product name as filename if no Content-Disposition header
      // Clean the product name to be safe for filenames
      const cleanName = productName
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .trim();
      filename = cleanName ? `${cleanName}.zip` : `product-${productId}.zip`;
    }

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  downloadInvoice: async (orderId: number | string): Promise<void> => {
    const url = `${API_BASE_URL}/api/orders/${orderId}/invoice`;

    // Build headers without forcing Content-Type for binary response
    const headers: Record<string, string> = {};
    const auth = defaultHeaders['Authorization'];
    if (auth) headers['Authorization'] = auth;

    const response = await fetch(url, {
      method: 'GET',
      headers: headers as HeadersInit,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Mirror apiUtils 401 handling
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete defaultHeaders['Authorization'];
        window.dispatchEvent(new CustomEvent('auth:logout', {
          detail: { reason: 'api_error' }
        }));
      }
      let errorMessage = `Failed to download invoice (${response.status})`;
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // Ignore body parsing errors; use generic message
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();

    // Determine filename from Content-Disposition header if present
    const cd = response.headers.get('content-disposition') || response.headers.get('Content-Disposition');
    let filename = `invoice-order-${orderId}.pdf`;
    if (cd) {
      const match = cd.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
      if (match && match[1]) {
        let fn = match[1].replace(/"/g, '');
        try { fn = decodeURIComponent(fn); } catch { /* ignore decode errors */ }
        filename = fn;
      }
    }

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  // ===== ORDER HISTORY METHODS =====

  /**
   * Get all orders for the current authenticated user
   * @param params - Query parameters for filtering, sorting, pagination
   */
  getUserOrders: async (_userId?: number, params?: OrderListParams): Promise<OrderListResponse> => {
    // Note: userId parameter is kept for backwards compatibility but not used
    // Backend uses authenticated user's ID from JWT token
    let url = `/api/orders/me`;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    return await apiClient.get<OrderListResponse>(url);
  },

  /**
   * Get details of a specific order
   * @param orderId - Order ID
   */
  getOrderDetails: async (orderId: number): Promise<Order> => {
    return await apiClient.get<Order>(`/api/orders/${orderId}`);
  },

  /**
   * Get tracking information for an order
   * @param orderId - Order ID
   */
  getTracking: async (orderId: number): Promise<TrackingInfo> => {
    return await apiClient.get<TrackingInfo>(`/api/orders/${orderId}/tracking`);
  },

  /**
   * Reorder items from a previous order
   * @param orderId - Original order ID
   */
  reorder: async (orderId: number): Promise<ReorderResponse> => {
    return await apiClient.post<ReorderResponse>(`/api/orders/${orderId}/reorder`);
  },

  /**
   * Cancel an order
   * @param orderId - Order ID
   * @param reason - Cancellation reason
   */
  cancelOrder: async (orderId: number, reason: string): Promise<CancelOrderResponse> => {
    return await apiClient.post<CancelOrderResponse>(`/api/orders/${orderId}/cancel`, { reason });
  },

  /**
   * Initiate a return for order items
   * @param orderId - Order ID
   * @param data - Return request data
   */
  initiateReturn: async (orderId: number, data: ReturnOrderRequest): Promise<ReturnOrderResponse> => {
    return await apiClient.post<ReturnOrderResponse>(`/api/orders/${orderId}/return`, data);
  },

  // ===== HELPER METHODS =====

  /**
   * Format order status for display
   * @param status - Order status
   */
  formatOrderStatus: (status: Order['status']): string => {
    const statusMap = {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return statusMap[status] || status;
  },

  /**
   * Get status color for UI
   * @param status - Order status
   */
  getStatusColor: (status: Order['status']): string => {
    const colorMap = {
      pending: '#FFA500',      // Orange
      processing: '#3B82F6',   // Blue
      shipped: '#8B5CF6',      // Purple
      delivered: '#10B981',    // Green
      cancelled: '#EF4444'     // Red
    };
    return colorMap[status] || '#6B7280';
  },

  /**
   * Check if order can be cancelled
   * @param order - Order object
   */
  canCancelOrder: (order: Order): boolean => {
    // Only pending and processing orders can be cancelled
    return ['pending', 'processing'].includes(order.status);
  },

  /**
   * Check if order can be returned
   * @param order - Order object
   */
  canReturnOrder: (order: Order): boolean => {
    // Only delivered orders can be returned
    // And within 30 days of delivery
    if (order.status !== 'delivered' || !order.deliveredAt) {
      return false;
    }

    const deliveredDate = new Date(order.deliveredAt);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysSinceDelivery <= 30;
  }
};
