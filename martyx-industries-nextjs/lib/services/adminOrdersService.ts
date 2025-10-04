import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

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
  user?: unknown; // backend may accept a nested user entity; keep flexible
  currency?: string;
  status?: string;
  orderDate?: string; // ISO string
  paymentDate?: string; // ISO string
  shippingAddress?: string;
  billingAddress?: string;
  paymentMethod?: string;
  paymentId?: string;
  notes?: string;
  totalAmount?: number;
  orderItems?: AdminOrderItem[];
  // keep pass-through for any extra fields
  [key: string]: unknown;
}

const jsonHeaders = () => defaultHeaders as HeadersInit;

export const adminOrdersService = {
  async getAllOrders(): Promise<AdminOrderDTO[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/orders`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    const data = await handleResponse(resp);
    return Array.isArray(data) ? (data as AdminOrderDTO[]) : [];
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
    const resp = await fetch(`${API_BASE_URL}/api/admin/orders`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(body),
    });
    return await handleResponse(resp) as AdminOrderDTO;
  },

  async updateOrder(id: string | number, payload: Partial<AdminOrderDTO>): Promise<AdminOrderDTO> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
    return await handleResponse(resp) as AdminOrderDTO;
  },

  async deleteOrder(id: string | number): Promise<void> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/orders/${id}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });
    // Some backends return 200 with message, others 204
    if (resp.status === 204) return;
    await handleResponse(resp);
  },
};
