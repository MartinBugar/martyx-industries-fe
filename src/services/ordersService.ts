import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type { Order } from '../context/authTypes';

// Types that approximate the backend OrderDTO shape
// We keep them flexible to avoid tight coupling
interface OrderItemDTO {
  id?: number | string;
  productId?: string | number;
  productName?: string;
  name?: string;
  title?: string;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  subtotal?: number;
  // nested product reference if present
  product?: {
    id?: string | number;
    name?: string;
    title?: string;
  };
}

interface OrderDTO {
  id?: number | string;
  orderNumber?: string;
  userEmail?: string;
  totalAmount?: number;
  currency?: string;
  status?: string; // e.g., PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
  orderDate?: string;
  paymentDate?: string;
  shippingAddress?: string;
  billingAddress?: string;
  paymentMethod?: string;
  paymentId?: string;
  notes?: string;
  orderItems?: OrderItemDTO[];
}

const normalizeStatus = (raw?: string): Order['status'] => {
  if (!raw) return 'processing';
  const s = raw.toUpperCase();
  switch (s) {
    case 'DELIVERED':
      return 'completed';
    case 'SHIPPED':
      return 'shipped';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'cancelled';
    case 'PROCESSING':
    case 'PAID':
    case 'PENDING':
    default:
      return 'processing';
  }
};

const toNumber = (value: any): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const mapOrderDTOToOrder = (dto: OrderDTO): Order => {
  const items = (dto.orderItems || []).map((it, idx) => {
    const productName = it.productName || it.name || it.title || it.product?.name || it.product?.title || `Item ${idx + 1}`;
    const quantity = toNumber(it.quantity ?? 1);
    // Prefer unitPrice, fall back to price or subtotal/quantity
    let price = it.unitPrice;
    if (price == null) price = it.price;
    if (price == null && it.subtotal != null && quantity > 0) price = toNumber(it.subtotal) / quantity;
    const numericPrice = toNumber(price);
    const productId = (it.productId ?? it.product?.id ?? it.id ?? `${idx+1}`).toString();

    return {
      productId,
      productName,
      quantity,
      price: numericPrice,
    };
  });

  // If backend totalAmount is missing, compute from items
  const computedTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalAmount = dto.totalAmount != null ? toNumber(dto.totalAmount) : computedTotal;

  // Prefer orderDate, fall back to paymentDate, else now
  const date = dto.orderDate || dto.paymentDate || new Date().toISOString();

  // Use orderNumber if present for readability, else id
  const idSource = dto.orderNumber || dto.id || `${Date.now()}`;

  return {
    id: String(idSource),
    date: String(date),
    items,
    totalAmount,
    status: normalizeStatus(dto.status),
  };
};

export const ordersService = {
  // Fetch current user's orders from backend
  fetchMyOrders: async (): Promise<Order[]> => {
    const response = await fetch(`${API_BASE_URL}/api/orders/me`, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    const data = await handleResponse(response) as OrderDTO[];
    // Map DTOs to frontend Order shape
    return Array.isArray(data) ? data.map(mapOrderDTOToOrder) : [];
  },
};
