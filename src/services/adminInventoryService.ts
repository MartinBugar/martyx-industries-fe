import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type {
  StockMovementDto,
  StockAlertDto
} from '../types/inventory';

/**
 * Service for admin inventory management operations
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

export const adminInventoryService = {
  // ===== Stock Movements =====

  /**
   * Get stock movement history with pagination and optional filters
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Sort field (default: 'movedAt')
   * @param sortDir - Sort direction (default: 'DESC')
   * @param productId - Optional product ID filter
   * @param variantId - Optional variant ID filter
   * @param movementType - Optional movement type filter
   * @returns Paginated list of stock movements
   */
  async getStockMovements(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'movedAt',
    sortDir: string = 'DESC',
    productId?: number,
    variantId?: number,
    movementType?: string
  ): Promise<PageResponse<StockMovementDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    });

    if (productId) {
      params.append('productId', productId.toString());
    }

    if (variantId) {
      params.append('variantId', variantId.toString());
    }

    if (movementType) {
      params.append('movementType', movementType);
    }

    const resp = await fetch(`${API_BASE_URL}/api/admin/inventory/movements?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<StockMovementDto>;
  },

  /**
   * Record a manual stock movement
   * @param dto - Stock movement data
   * @returns Created stock movement
   */
  async recordStockMovement(dto: StockMovementDto): Promise<StockMovementDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/inventory/movements`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    });

    return await handleResponse(resp) as StockMovementDto;
  },

  /**
   * Get stock movements for a specific product
   * @param productId - Product ID
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Sort field (default: 'movedAt')
   * @param sortDir - Sort direction (default: 'DESC')
   * @returns Paginated list of stock movements
   */
  async getProductMovements(
    productId: number,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'movedAt',
    sortDir: string = 'DESC'
  ): Promise<PageResponse<StockMovementDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    });

    const resp = await fetch(`${API_BASE_URL}/api/admin/inventory/movements/product/${productId}?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<StockMovementDto>;
  },

  /**
   * Get stock movements for a specific variant
   * @param variantId - Variant ID
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Sort field (default: 'movedAt')
   * @param sortDir - Sort direction (default: 'DESC')
   * @returns Paginated list of stock movements
   */
  async getVariantMovements(
    variantId: number,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'movedAt',
    sortDir: string = 'DESC'
  ): Promise<PageResponse<StockMovementDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    });

    const resp = await fetch(`${API_BASE_URL}/api/admin/inventory/movements/variant/${variantId}?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<StockMovementDto>;
  },

  // ===== Stock Alerts =====

  /**
   * Get stock alerts with optional status filter
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Sort field (default: 'createdAt')
   * @param sortDir - Sort direction (default: 'DESC')
   * @param status - Optional alert status filter
   * @returns Paginated list of stock alerts
   */
  async getStockAlerts(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'DESC',
    status?: string
  ): Promise<PageResponse<StockAlertDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    });

    if (status) {
      params.append('status', status);
    }

    const resp = await fetch(`${API_BASE_URL}/api/admin/inventory/alerts?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<StockAlertDto>;
  },

  /**
   * Acknowledge a stock alert
   * @param id - Alert ID
   * @param adminId - Admin user ID
   * @returns Updated stock alert
   */
  async acknowledgeAlert(id: number, adminId: number): Promise<StockAlertDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/inventory/alerts/${id}/acknowledge?adminId=${adminId}`, {
      method: 'PUT',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as StockAlertDto;
  },

  /**
   * Resolve a stock alert
   * @param id - Alert ID
   * @param notes - Resolution notes
   * @returns Updated stock alert
   */
  async resolveAlert(id: number, notes: string): Promise<StockAlertDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/inventory/alerts/${id}/resolve`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify({ notes }),
    });

    return await handleResponse(resp) as StockAlertDto;
  },

  // ===== Stock Operations =====

  /**
   * Reconcile stock for a variant
   * @param variantId - Variant ID
   * @returns Reconciliation result
   */
  async reconcileStock(variantId: number): Promise<Record<string, any>> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/inventory/reconcile/${variantId}`, {
      method: 'POST',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp);
  },

  /**
   * Manually adjust stock for a variant
   * @param variantId - Variant ID
   * @param quantity - Adjustment quantity
   * @param reason - Adjustment reason
   * @returns Adjustment result
   */
  async adjustStock(variantId: number, quantity: number, reason: string): Promise<Record<string, any>> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/inventory/adjust/${variantId}`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ quantity, reason }),
    });

    return await handleResponse(resp);
  },
};
