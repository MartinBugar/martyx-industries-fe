import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

export interface AdminOrderItem {
  id?: number | string;
  productId?: number | string;
  productName?: string;
  name?: string;
  title?: string;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  subtotal?: number;
  // optional nested product
  product?: {
    id?: number | string;
    name?: string;
    title?: string;
    productType?: string;
  };
}

export interface AdminOrderDTO {
  id?: number | string;
  orderNumber?: string;
  userEmail?: string;
  firstName?: string;
  lastName?: string;
  user?: unknown; // backend may accept a nested user entity; keep flexible
  currency?: string;
  status?: string;
  orderDate?: string; // ISO string
  paymentDate?: string; // ISO string
  shippingAddress?: string;
  billingAddress?: string;
  paymentMethod?: string;
  paymentId?: string;
  invoiceNumber?: string;
  salesChannel?: string; // ONLINE_SHOP, MANUAL_ADMIN, etc.
  notes?: string;
  totalAmount?: number;
  orderItems?: AdminOrderItem[];
  // Shipping/fulfillment fields for physical products
  shippingStatus?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  estimatedDeliveryDate?: string;
  shippingNotes?: string;
  fulfillmentStatus?: string;
  hasPhysicalItems?: boolean;
  hasDigitalItems?: boolean;
  // Cancellation info
  cancelledAt?: string;
  cancellationReason?: string;
  // keep pass-through for any extra fields
  [key: string]: unknown;
}

export interface UpdateOrderStatusRequest {
  status: string;
  shippingStatus?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
  sendNotification?: boolean;
}

export interface OrderTimelineEvent {
  status: string;
  label: string;
  timestamp: string;
  completed: boolean;
  trackingNumber?: string;
  carrier?: string;
  reason?: string;
}

export interface OrderTimelineResponse {
  orderId: number;
  orderNumber: string;
  currentStatus: string;
  shippingStatus?: string;
  timeline: OrderTimelineEvent[];
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

const jsonHeaders = () => defaultHeaders as HeadersInit;

export const adminOrdersService = {
  async getAllOrders(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'id',
    sortDir: string = 'DESC'
  ): Promise<PageResponse<AdminOrderDTO>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir
    });

    const resp = await fetch(`${API_BASE_URL}/api/admin/orders?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    const data = await handleResponse(resp);

    // If backend returns paginated response, return it; otherwise wrap in page structure
    if (data && typeof data === 'object' && 'content' in data) {
      return data as PageResponse<AdminOrderDTO>;
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

  async getOrderById(id: string | number): Promise<AdminOrderDTO> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/orders/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    return await handleResponse(resp) as AdminOrderDTO;
  },

  async createOrder(payload: Partial<AdminOrderDTO>): Promise<AdminOrderDTO> {
    // Ensure orderItems is an array if not provided
    const body: Partial<AdminOrderDTO> = {
      orderItems: [],
      ...payload,
    };
    const resp = await fetch(`${API_BASE_URL}/api/admin/orders`, withLangHeaders({
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(body),
    }));
    return await handleResponse(resp) as AdminOrderDTO;
  },

  async updateOrder(id: string | number, payload: Partial<AdminOrderDTO>): Promise<AdminOrderDTO> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/orders/${id}`, withLangHeaders({
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    }));
    return await handleResponse(resp) as AdminOrderDTO;
  },

  async deleteOrder(id: string | number): Promise<void> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/orders/${id}`, withLangHeaders({
      method: 'DELETE',
      headers: jsonHeaders(),
    }));
    // Some backends return 200 with message, others 204
    if (resp.status === 204) return;
    await handleResponse(resp);
  },

  // =========================================================================
  // ORDER STATUS MANAGEMENT
  // =========================================================================

  async updateOrderStatus(id: string | number, request: UpdateOrderStatusRequest): Promise<{ success: boolean; message: string; order: AdminOrderDTO }> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/orders/${id}/status`, withLangHeaders({
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(request),
    }));
    return await handleResponse(resp);
  },

  async updateShippingInfo(
    id: string | number,
    shippingCarrier?: string,
    trackingNumber?: string,
    trackingUrl?: string
  ): Promise<{ success: boolean; message: string; order: AdminOrderDTO }> {
    const params = new URLSearchParams();
    if (shippingCarrier) params.append('shippingCarrier', shippingCarrier);
    if (trackingNumber) params.append('trackingNumber', trackingNumber);
    if (trackingUrl) params.append('trackingUrl', trackingUrl);

    const resp = await fetch(`${API_BASE_URL}/api/admin/orders/${id}/shipping?${params}`, withLangHeaders({
      method: 'PUT',
      headers: jsonHeaders(),
    }));
    return await handleResponse(resp);
  },

  async markAsProcessing(id: string | number): Promise<{ success: boolean; message: string; order: AdminOrderDTO }> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/orders/${id}/mark-processing`, withLangHeaders({
      method: 'POST',
      headers: jsonHeaders(),
    }));
    return await handleResponse(resp);
  },

  async markAsPacked(id: string | number): Promise<{ success: boolean; message: string; order: AdminOrderDTO }> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/orders/${id}/mark-packed`, withLangHeaders({
      method: 'POST',
      headers: jsonHeaders(),
    }));
    return await handleResponse(resp);
  },

  async markAsShipped(
    id: string | number,
    shippingCarrier?: string,
    trackingNumber?: string,
    trackingUrl?: string
  ): Promise<{ success: boolean; message: string; order: AdminOrderDTO }> {
    const params = new URLSearchParams();
    if (shippingCarrier) params.append('shippingCarrier', shippingCarrier);
    if (trackingNumber) params.append('trackingNumber', trackingNumber);
    if (trackingUrl) params.append('trackingUrl', trackingUrl);

    const resp = await fetch(`${API_BASE_URL}/api/admin/orders/${id}/mark-shipped?${params}`, withLangHeaders({
      method: 'POST',
      headers: jsonHeaders(),
    }));
    return await handleResponse(resp);
  },

  async markAsDelivered(id: string | number): Promise<{ success: boolean; message: string; order: AdminOrderDTO }> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/orders/${id}/mark-delivered`, withLangHeaders({
      method: 'POST',
      headers: jsonHeaders(),
    }));
    return await handleResponse(resp);
  },

  async cancelOrder(id: string | number, reason?: string): Promise<{ success: boolean; message: string; order: AdminOrderDTO }> {
    const params = new URLSearchParams();
    if (reason) params.append('reason', reason);

    const resp = await fetch(`${API_BASE_URL}/api/admin/orders/${id}/cancel?${params}`, withLangHeaders({
      method: 'POST',
      headers: jsonHeaders(),
    }));
    return await handleResponse(resp);
  },

  async getOrderTimeline(id: string | number): Promise<OrderTimelineResponse> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/orders/${id}/timeline`, withLangHeaders({
      method: 'GET',
      headers: jsonHeaders(),
    }));
    return await handleResponse(resp);
  },
};
