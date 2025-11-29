import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import type {
  SupplierDto,
  PurchaseOrderDto,
  PurchaseOrderCreateDto
} from '../types/inventory';

/**
 * Service for admin supplier and purchase order management operations
 */

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

export const adminSupplierService = {
  // ===== Supplier Management =====

  /**
   * Get all suppliers with pagination and optional search
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Sort field (default: 'name')
   * @param sortDir - Sort direction (default: 'ASC')
   * @param search - Optional search term
   * @returns Paginated list of suppliers
   */
  async getAllSuppliers(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'name',
    sortDir: string = 'ASC',
    search?: string
  ): Promise<PageResponse<SupplierDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    });

    if (search) {
      params.append('search', search);
    }

    const resp = await fetch(`${API_BASE_URL}/api/admin/suppliers?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<SupplierDto>;
  },

  /**
   * Get supplier details by ID
   * @param id - Supplier ID
   * @returns Supplier details
   */
  async getSupplierById(id: number): Promise<SupplierDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/suppliers/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as SupplierDto;
  },

  /**
   * Create a new supplier
   * @param dto - Supplier creation data
   * @returns Created supplier
   */
  async createSupplier(dto: SupplierDto): Promise<SupplierDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/suppliers`, withLangHeaders({
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    }));

    return await handleResponse(resp) as SupplierDto;
  },

  /**
   * Update an existing supplier
   * @param id - Supplier ID
   * @param dto - Updated supplier data
   * @returns Updated supplier
   */
  async updateSupplier(id: number, dto: SupplierDto): Promise<SupplierDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/suppliers/${id}`, withLangHeaders({
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    }));

    return await handleResponse(resp) as SupplierDto;
  },

  /**
   * Delete a supplier
   * @param id - Supplier ID
   * @returns Success response
   */
  async deleteSupplier(id: number): Promise<{ message: string }> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/suppliers/${id}`, withLangHeaders({
      method: 'DELETE',
      headers: jsonHeaders(),
    }));

    return await handleResponse(resp);
  },

  // ===== Purchase Order Management =====

  /**
   * Get all purchase orders with pagination and optional filters
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Sort field (default: 'orderedAt')
   * @param sortDir - Sort direction (default: 'DESC')
   * @param supplierId - Optional supplier ID filter
   * @param status - Optional status filter
   * @returns Paginated list of purchase orders
   */
  async getAllPurchaseOrders(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'orderedAt',
    sortDir: string = 'DESC',
    supplierId?: number,
    status?: string
  ): Promise<PageResponse<PurchaseOrderDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    });

    if (supplierId) {
      params.append('supplierId', supplierId.toString());
    }

    if (status) {
      params.append('status', status);
    }

    const resp = await fetch(`${API_BASE_URL}/api/admin/suppliers/purchase-orders?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<PurchaseOrderDto>;
  },

  /**
   * Create a new purchase order
   * @param dto - Purchase order creation data
   * @returns Created purchase order
   */
  async createPurchaseOrder(dto: PurchaseOrderCreateDto): Promise<PurchaseOrderDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/suppliers/purchase-orders`, withLangHeaders({
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    }));

    return await handleResponse(resp) as PurchaseOrderDto;
  },

  /**
   * Get purchase order details by ID
   * @param id - Purchase order ID
   * @returns Purchase order details
   */
  async getPurchaseOrderById(id: number): Promise<PurchaseOrderDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/suppliers/purchase-orders/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PurchaseOrderDto;
  },

  /**
   * Receive a purchase order and update inventory
   * @param id - Purchase order ID
   * @returns Updated purchase order
   */
  async receivePurchaseOrder(id: number): Promise<PurchaseOrderDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/suppliers/purchase-orders/${id}/receive`, withLangHeaders({
      method: 'PUT',
      headers: jsonHeaders(),
    }));

    return await handleResponse(resp) as PurchaseOrderDto;
  },
};
