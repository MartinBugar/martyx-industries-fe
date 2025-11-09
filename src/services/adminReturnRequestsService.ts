import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

/**
 * Service for admin return request (RMA) management operations
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ReturnRequestDto {
  id: number;
  rma_number: string;
  order_id: number;
  user_id: number;
  return_type: 'REFUND' | 'EXCHANGE' | 'REPAIR';
  return_status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  return_reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'NOT_AS_DESCRIBED' | 'CHANGED_MIND' | 'DAMAGED_IN_SHIPPING' | 'OTHER';
  return_items: string; // JSON array
  customer_notes?: string;
  customer_images?: string[]; // Array of image URLs
  refund_amount?: number;
  refund_method?: 'ORIGINAL_PAYMENT' | 'STORE_CREDIT' | 'BANK_TRANSFER';
  refund_processed_at?: string;
  refund_transaction_id?: string;
  return_shipping_carrier?: string;
  return_tracking_number?: string;
  return_label_url?: string;
  return_shipping_cost?: number;
  customer_pays_shipping: boolean;
  received_at?: string;
  inspected_at?: string;
  inspection_notes?: string;
  approved_by?: number;
  approved_at?: string;
  rejected_reason?: string;
  items_restocked: boolean;
  restocked_at?: string;
  restocking_fee?: number;
  requested_at: string;
  updated_at: string;
  completed_at?: string;
  cancelled_at?: string;
  ip_address?: string;
}

export interface RmaApprovalDto {
  approved_by: number;
  admin_notes?: string;
}

export interface RmaRejectionDto {
  rejected_reason: string;
}

export interface RefundDto {
  refund_amount: number;
  refund_transaction_id: string;
}

export interface ReturnRequestStats {
  total_returns: number;
  pending_returns: number;
  approved_returns: number;
  rejected_returns: number;
  completed_returns: number;
  total_refunded: number;
  avg_refund_amount: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// ============================================================================
// SERVICE METHODS
// ============================================================================

const jsonHeaders = () => ({
  ...defaultHeaders,
  'Content-Type': 'application/json',
} as HeadersInit);

export const adminReturnRequestsService = {
  /**
   * Get all return requests with pagination and filtering
   */
  async getAllReturns(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'requested_at',
    sortDir: 'ASC' | 'DESC' = 'DESC',
    status?: string
  ): Promise<PageResponse<ReturnRequestDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir,
    });

    if (status) {
      params.append('status', status);
    }

    const resp = await fetch(`${API_BASE_URL}/api/admin/returns?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<ReturnRequestDto>;
  },

  /**
   * Get return request by ID
   */
  async getById(id: number): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Get return request by RMA number
   */
  async getByRmaNumber(rmaNumber: string): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/rma/${encodeURIComponent(rmaNumber)}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Get pending returns (awaiting approval)
   */
  async getPendingReturns(): Promise<ReturnRequestDto[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/pending`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ReturnRequestDto[];
  },

  /**
   * Approve a return request
   */
  async approveReturn(id: number, approval: RmaApprovalDto): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}/approve`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(approval),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Reject a return request
   */
  async rejectReturn(id: number, rejection: RmaRejectionDto): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}/reject`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(rejection),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Mark return as received
   */
  async markAsReceived(id: number): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}/receive`, {
      method: 'PUT',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Process refund for return
   */
  async processRefund(id: number, refund: RefundDto): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}/refund`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(refund),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Complete a return
   */
  async completeReturn(id: number): Promise<ReturnRequestDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/${id}/complete`, {
      method: 'PUT',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ReturnRequestDto;
  },

  /**
   * Get return request statistics
   */
  async getStats(): Promise<ReturnRequestStats> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/stats`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ReturnRequestStats;
  },

  /**
   * Get returns by date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<ReturnRequestDto[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    const resp = await fetch(`${API_BASE_URL}/api/admin/returns/date-range?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ReturnRequestDto[];
  },
};
