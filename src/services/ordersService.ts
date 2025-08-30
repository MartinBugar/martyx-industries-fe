import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import { removeAuthToken } from './api';
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
  // common casing variants for product type coming from backend
  productType?: string;
  ProductType?: string;
  // nested product reference if present
  product?: {
    id?: string | number;
    name?: string;
    title?: string;
    productType?: string;
    ProductType?: string;
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
  // Preserve backend-provided status so UI can display the actual value from the database.
  // Fallback to 'unknown' only when status is missing/null/empty.
  if (raw == null) return 'unknown';
  const s = String(raw).trim();
  return s.length > 0 ? s : 'unknown';
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
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
    const rawType = it.productType ?? it.ProductType ?? it.product?.productType ?? it.product?.ProductType;
    const productType = rawType != null ? String(rawType) : undefined;

    return {
      productId,
      productName,
      quantity,
      price: numericPrice,
      productType,
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
    backendId: dto.id != null ? String(dto.id) : undefined,
    date: String(date),
    items,
    totalAmount,
    status: normalizeStatus(dto.status),
    // Optional fields
    orderNumber: dto.orderNumber ? String(dto.orderNumber) : undefined,
    userEmail: dto.userEmail,
    currency: dto.currency,
    paymentDate: dto.paymentDate,
    shippingAddress: dto.shippingAddress,
    billingAddress: dto.billingAddress,
    paymentMethod: dto.paymentMethod,
    paymentId: dto.paymentId,
    notes: dto.notes,
  };
};

export const ordersService = {
  // Fetch current user's orders from backend
  fetchMyOrders: async (): Promise<Order[]> => {
    const response = await fetch(`${API_BASE_URL}/api/orders/me`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    const data = await handleResponse(response) as OrderDTO[];
    // Map DTOs to frontend Order shape
    return Array.isArray(data) ? data.map(mapOrderDTOToOrder) : [];
  },

  // Download a paid digital product for a specific order item (legacy endpoint; may not be supported)
  downloadProduct: async (orderId: string | number, productId: string | number, productName?: string): Promise<boolean> => {
    try {
      const url = `${API_BASE_URL}/api/orders/${orderId}/items/${productId}/download`;
      // Clone headers from defaultHeaders and remove Content-Type for binary GET
      const headers: Record<string, string> = {};
      Object.entries(defaultHeaders).forEach(([key, value]) => {
        if (value !== undefined) headers[key] = value;
      });
      delete headers['Content-Type'];

      const response = await fetch(url, withLangHeaders({
        method: 'GET',
        headers: headers as HeadersInit,
      }));

      if (!response.ok) {
        // Attempt to read error message as text
        const message = await response.text().catch(() => 'Failed to download');
        if (response.status === 401) {
          // Mirror apiUtils.handleResponse 401 handling
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          removeAuthToken();
          window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'api_error' } }));
        }
        alert(message || `Error ${response.status}: Unable to download the file`);
        return false;
      }

      // Get filename from headers with robust parsing and sanitization
      const disposition = response.headers.get('Content-Disposition') || response.headers.get('content-disposition') || '';

      const extractFilename = (disp: string): string | null => {
        if (!disp) return null;
        // Try RFC 5987: filename*=charset'lang'value
        let m = disp.match(/filename\*=(?:UTF-8)?'(?:[^']*)'([^;\r\n]+)/i);
        if (m && m[1]) {
          const val = m[1].trim().replace(/^"|"$/g, '');
          try { return decodeURIComponent(val); } catch { return val; }
        }
        // Try simplified RFC 5987: filename*=UTF-8''value
        m = disp.match(/filename\*=UTF-8''([^;\r\n]+)/i);
        if (m && m[1]) {
          const val = m[1].trim().replace(/^"|"$/g, '');
          try { return decodeURIComponent(val); } catch { return val; }
        }
        // Try quoted filename
        m = disp.match(/filename=\"([^\"\r\n]+)\"/i);
        if (m && m[1]) {
          const val = m[1].trim();
          try { return decodeURIComponent(val); } catch { return val; }
        }
        // Try unquoted filename
        m = disp.match(/filename=([^;\r\n]+)/i);
        if (m && m[1]) {
          const val = m[1].trim().replace(/^\"|\"$/g, '');
          try { return decodeURIComponent(val); } catch { return val; }
        }
        return null;
      };

      const sanitizeFilename = (name: string): string => {
        // keep only basename and allow safe characters
        const base = (name || '').split(/[\\\\\/]/).pop() || '';
        // whitelist: letters, numbers, spaces, dot, dash, underscore, and parentheses
        const cleaned = base.replace(/[^a-zA-Z0-9 ._()-]+/g, '_').trim();
        // avoid leading/trailing dots/spaces
        const trimmedDots = cleaned.replace(/^[. ]+|[. ]+$/g, '');
        return trimmedDots || '';
      };

      // Ensure the downloaded filename ends with .zip
      const forceZipExtension = (name: string): string => {
        if (!name) return 'product.zip';
        let base = name.trim();
        // If already .zip (any case), normalize to lower-case extension
        if (/\.zip$/i.test(base)) {
          return base.replace(/\.[^.]+$/i, '.zip');
        }
        // Remove any existing extension and add .zip
        base = base.replace(/\.[^.]+$/i, '');
        return `${base}.zip`;
      };

      // Priority: provided productName -> header filename -> default
      let filenameBase = '';
      if (productName) {
        filenameBase = sanitizeFilename(productName);
      }
      if (!filenameBase) {
        const headerName = extractFilename(disposition) || '';
        filenameBase = sanitizeFilename(headerName);
      }
      if (!filenameBase) {
        filenameBase = `product-${productId}`;
      }
      const filename = forceZipExtension(filenameBase);

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        alert('File not available for download');
        return false;
      }

      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      return true;
    } catch (error) {
      console.error('Download product error:', error);
      alert('An unexpected error occurred while downloading the file.');
      return false;
    }
  },

  // Download by full URL (including token), e.g. /api/download/{token}
  downloadByUrl: async (downloadUrl: string, suggestedName?: string): Promise<boolean> => {
    try {
      if (!downloadUrl) {
        console.debug('[ordersService.downloadByUrl] No downloadUrl provided');
        return false;
      }
      const { downloadProductByUrl } = await import('./download');
      return await downloadProductByUrl(downloadUrl, suggestedName);
    } catch (error) {
      console.error('Download by URL error:', error);
      return false;
    }
  },

  // Download invoice by URL (including token), e.g. /api/download/invoice/{token}
  downloadInvoiceByUrl: async (downloadUrl: string, suggestedName?: string): Promise<boolean> => {
    try {
      if (!downloadUrl) {
        console.debug('[ordersService.downloadInvoiceByUrl] No downloadUrl provided');
        return false;
      }
      const { downloadInvoiceByUrl } = await import('./download');
      return await downloadInvoiceByUrl(downloadUrl, suggestedName);
    } catch (error) {
      console.error('Download invoice by URL error:', error);
      return false;
    }
  },

  // Trigger sending order confirmation/download email to the customer
  sendOrderEmail: async (orderId: number | string, email?: string): Promise<void> => {
    const url = `${API_BASE_URL}/api/orders/${orderId}/email`;
    const headers: Record<string, string> = {};
    Object.entries(defaultHeaders).forEach(([key, value]) => {
      if (value !== undefined) headers[key] = value as string;
    });
    const response = await fetch(url, withLangHeaders({
      method: 'POST',
      headers: headers as HeadersInit,
      body: JSON.stringify(email ? { email } : {}),
    }));
    await handleResponse(response);
  },
};
