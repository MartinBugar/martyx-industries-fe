import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import { PageResponse } from './adminOrdersService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Request for creating a manual order (in-store purchase, phone order, etc.)
 */
export interface ManualOrderCreateRequest {
  recipientEmail: string;
  firstName?: string;
  lastName?: string;
  items: ManualOrderItem[];
  paymentMethod: string; // e.g., "CASH_IN_STORE", "CARD_IN_STORE"
  storeLocation?: string; // e.g., "Bratislava - Centrum"
  storeEmployeeName?: string;
  notes?: string;
  billingAddress?: BillingAddressRequest;
  metadata?: Record<string, any>;
}

export interface ManualOrderItem {
  variantId: number;
  quantity: number;
}

export interface BillingAddressRequest {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  companyName?: string;
  ico?: string; // Company registration number (SK)
  dic?: string; // Tax ID (SK)
  icDph?: string; // VAT ID (SK)
}

/**
 * Response after creating a manual order
 */
export interface ManualOrderCreateResponse {
  success: boolean;
  message: string;
  orderId: number;
  orderNumber: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  orderDate: string;
  emailSent: boolean;
  recipientEmail: string;
  downloadLinks: string[];
  salesChannel: string;
  createdByAdminEmail: string;
  storeLocation?: string;
  itemCount: number;
  items: OrderItemSummary[];
}

export interface OrderItemSummary {
  variantId: number;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  isDigital: boolean;
}

/**
 * Manual order history DTO (for displaying in admin panel)
 */
export interface ManualOrderHistoryDTO {
  orderId: number;
  orderNumber: string;
  invoiceNumber?: string;
  recipientEmail: string;
  firstName?: string;
  lastName?: string;
  totalAmount: number;
  currency: string;
  orderStatus: string;
  orderDate: string;
  paymentDate?: string;
  salesChannel: string;
  createdByAdminEmail?: string;
  storeLocation?: string;
  storeEmployeeName?: string;
  paymentMethod?: string;
  itemCount: number;
  hasDigitalItems: boolean;
  hasPhysicalItems: boolean;
  notes?: string;
}

/**
 * Product variant DTO for selection dropdown
 */
export interface ProductVariantDTO {
  variantId: number;
  masterProductName: string;
  variantName: string;
  sku: string;
  priceWithVat: string;
  currency: string;
  isDigital: boolean;
  isPhysical: boolean;
  stockQuantity?: number;
}

/**
 * Downloadable product DTO (digital products only)
 */
export interface DownloadableProductDTO {
  variantId: number;
  masterProductName: string;
  variantName: string;
  sku: string;
  priceWithVat: string;
  currency: string;
  fileSizeBytes?: number;
  fileFormat?: string;
}

// ============================================================================
// API SERVICE
// ============================================================================

const jsonHeaders = () => defaultHeaders as HeadersInit;

export const manualOrdersService = {
  /**
   * Create a manual order on behalf of a customer.
   * Used for in-store purchases, phone orders, etc.
   *
   * POST /api/admin/manual-orders/create
   */
  async createManualOrder(request: ManualOrderCreateRequest): Promise<ManualOrderCreateResponse> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/manual-orders/create`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(request),
    });
    return await handleResponse(resp) as ManualOrderCreateResponse;
  },

  /**
   * Get paginated history of all manual orders.
   * Returns orders where sales_channel = MANUAL_ADMIN.
   *
   * GET /api/admin/manual-orders/history?page=0&size=20&sort=orderDate,desc
   */
  async getManualOrderHistory(
    page: number = 0,
    size: number = 20,
    sort: string = 'orderDate,desc'
  ): Promise<PageResponse<ManualOrderHistoryDTO>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort,
    });

    const resp = await fetch(`${API_BASE_URL}/api/admin/manual-orders/history?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    const data = await handleResponse(resp);

    // Ensure paginated response structure
    if (data && typeof data === 'object' && 'content' in data) {
      return data as PageResponse<ManualOrderHistoryDTO>;
    }

    // Fallback for non-paginated response
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

  /**
   * Get manual orders created by a specific admin.
   *
   * GET /api/admin/manual-orders/by-admin/{adminId}?page=0&size=20
   */
  async getManualOrdersByAdmin(
    adminId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ManualOrderHistoryDTO>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    const resp = await fetch(
      `${API_BASE_URL}/api/admin/manual-orders/by-admin/${adminId}?${params}`,
      {
        method: 'GET',
        headers: jsonHeaders(),
      }
    );
    const data = await handleResponse(resp);

    if (data && typeof data === 'object' && 'content' in data) {
      return data as PageResponse<ManualOrderHistoryDTO>;
    }

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

  /**
   * Get manual orders for a specific store location.
   *
   * GET /api/admin/manual-orders/by-store?location=Bratislava&page=0&size=20
   */
  async getManualOrdersByStore(
    location: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ManualOrderHistoryDTO>> {
    const params = new URLSearchParams({
      location,
      page: page.toString(),
      size: size.toString(),
    });

    const resp = await fetch(`${API_BASE_URL}/api/admin/manual-orders/by-store?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    const data = await handleResponse(resp);

    if (data && typeof data === 'object' && 'content' in data) {
      return data as PageResponse<ManualOrderHistoryDTO>;
    }

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

  /**
   * Get all available product variants (for product selection dropdown).
   *
   * GET /api/admin/manual-orders/products
   */
  async getAvailableProducts(): Promise<ProductVariantDTO[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/manual-orders/products`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    const data = await handleResponse(resp);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get all downloadable product variants (digital products only).
   *
   * GET /api/admin/manual-orders/downloadable-products
   */
  async getDownloadableProducts(): Promise<DownloadableProductDTO[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/manual-orders/downloadable-products`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    const data = await handleResponse(resp);
    return Array.isArray(data) ? data : [];
  },
};
