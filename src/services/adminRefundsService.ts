import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

const BASE_URL = `${API_BASE_URL}/api/admin/refunds`;

// Types
export type RefundStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED'
  | 'CANCELLED';

export type RefundReason =
  | 'CUSTOMER_REQUEST'
  | 'PRODUCT_DEFECTIVE'
  | 'PRODUCT_NOT_AS_DESCRIBED'
  | 'WRONG_ITEM_SENT'
  | 'ORDER_CANCELLED'
  | 'DUPLICATE_ORDER'
  | 'SHIPPING_ISSUE'
  | 'NEVER_RECEIVED'
  | 'PARTIAL_ORDER'
  | 'PRICE_ADJUSTMENT'
  | 'GOODWILL'
  | 'OTHER';

export type RefundType = 'FULL' | 'PARTIAL';

export interface RefundDto {
  id: number;
  refundNumber: string;

  // Order info
  orderId: number;
  orderNumber: string;
  orderUserEmail: string | null;
  orderUserName: string | null;

  // Amount
  amount: number;
  currency: string;
  originalOrderAmount: number | null;

  // Status and reason
  status: RefundStatus;
  statusLabel: string;
  reason: RefundReason;
  reasonLabel: string;
  reasonDetails: string | null;
  refundType: RefundType;
  refundTypeLabel: string;

  // Payment provider
  paymentProvider: string | null;
  providerRefundId: string | null;
  providerStatus: string | null;
  providerError: string | null;

  // Processing info
  processedById: number | null;
  processedByName: string | null;
  requestedById: number | null;
  requestedByName: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string | null;
  processedAt: string | null;
  completedAt: string | null;

  // Notification
  customerNotified: boolean;
  customerNotifiedAt: string | null;

  // Notes
  internalNotes: string | null;
  refundedItems: string | null;
}

export interface RefundStatsDto {
  totalRefunds: number;
  pendingCount: number;
  approvedCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  rejectedCount: number;
  cancelledCount: number;
  totalRefundedAmount: number;
  pendingAmount: number;
  refundedThisMonth: number;
  refundedThisWeek: number;
  byReason: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface CreateRefundRequest {
  orderId: number;
  amount: number;
  reason: RefundReason;
  reasonDetails?: string;
  refundType?: RefundType;
  internalNotes?: string;
  refundedItems?: string;
}

export interface UpdateRefundRequest {
  amount?: number;
  reason?: RefundReason;
  reasonDetails?: string;
  internalNotes?: string;
  refundedItems?: string;
}

export interface ProcessRefundRequest {
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
  internalNotes?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ==================== API Functions ====================

// CRUD
export const getAllRefunds = async (
  page: number = 0,
  size: number = 20
): Promise<Page<RefundDto>> => {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
  const response = await fetch(`${BASE_URL}?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getRefundsWithFilters = async (
  filters: {
    status?: RefundStatus;
    reason?: RefundReason;
    startDate?: string;
    endDate?: string;
  },
  page: number = 0,
  size: number = 20
): Promise<Page<RefundDto>> => {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
  if (filters.status) params.append('status', filters.status);
  if (filters.reason) params.append('reason', filters.reason);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  const response = await fetch(`${BASE_URL}/filter?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const searchRefunds = async (
  query: string,
  page: number = 0,
  size: number = 20
): Promise<Page<RefundDto>> => {
  const params = new URLSearchParams({ q: query, page: page.toString(), size: size.toString() });
  const response = await fetch(`${BASE_URL}/search?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getRefundsByStatus = async (
  status: RefundStatus,
  page: number = 0,
  size: number = 20
): Promise<Page<RefundDto>> => {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
  const response = await fetch(`${BASE_URL}/status/${status}?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getPendingRefunds = async (): Promise<RefundDto[]> => {
  const response = await fetch(`${BASE_URL}/pending`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getRecentRefunds = async (limit: number = 10): Promise<RefundDto[]> => {
  const params = new URLSearchParams({ limit: limit.toString() });
  const response = await fetch(`${BASE_URL}/recent?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getRefundsByOrderId = async (orderId: number): Promise<RefundDto[]> => {
  const response = await fetch(`${BASE_URL}/order/${orderId}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getRefundById = async (id: number): Promise<RefundDto> => {
  const response = await fetch(`${BASE_URL}/${id}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getRefundByNumber = async (refundNumber: string): Promise<RefundDto> => {
  const response = await fetch(`${BASE_URL}/number/${refundNumber}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const createRefund = async (request: CreateRefundRequest): Promise<RefundDto> => {
  const response = await fetch(BASE_URL, withLangHeaders({
    method: 'POST',
    headers: defaultHeaders as HeadersInit,
    body: JSON.stringify(request),
  }));
  return handleResponse(response);
};

export const updateRefund = async (id: number, request: UpdateRefundRequest): Promise<RefundDto> => {
  const response = await fetch(`${BASE_URL}/${id}`, withLangHeaders({
    method: 'PUT',
    headers: defaultHeaders as HeadersInit,
    body: JSON.stringify(request),
  }));
  return handleResponse(response);
};

export const deleteRefund = async (id: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/${id}`, withLangHeaders({
    method: 'DELETE',
    headers: defaultHeaders as HeadersInit,
  }));
  if (!response.ok) {
    throw new Error('Failed to delete refund');
  }
};

// Workflow Actions
export const processRefund = async (id: number, request: ProcessRefundRequest): Promise<RefundDto> => {
  const response = await fetch(`${BASE_URL}/${id}/process`, withLangHeaders({
    method: 'POST',
    headers: defaultHeaders as HeadersInit,
    body: JSON.stringify(request),
  }));
  return handleResponse(response);
};

export const approveRefund = async (id: number, notes?: string): Promise<RefundDto> => {
  const response = await fetch(`${BASE_URL}/${id}/approve`, withLangHeaders({
    method: 'POST',
    headers: defaultHeaders as HeadersInit,
    body: JSON.stringify({ notes }),
  }));
  return handleResponse(response);
};

export const rejectRefund = async (id: number, reason: string): Promise<RefundDto> => {
  const response = await fetch(`${BASE_URL}/${id}/reject`, withLangHeaders({
    method: 'POST',
    headers: defaultHeaders as HeadersInit,
    body: JSON.stringify({ reason }),
  }));
  return handleResponse(response);
};

export const executeRefund = async (id: number): Promise<RefundDto> => {
  const response = await fetch(`${BASE_URL}/${id}/execute`, withLangHeaders({
    method: 'POST',
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const cancelRefund = async (id: number): Promise<RefundDto> => {
  const response = await fetch(`${BASE_URL}/${id}/cancel`, withLangHeaders({
    method: 'POST',
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const completeRefund = async (id: number, providerRefundId?: string): Promise<RefundDto> => {
  const response = await fetch(`${BASE_URL}/${id}/complete`, withLangHeaders({
    method: 'POST',
    headers: defaultHeaders as HeadersInit,
    body: JSON.stringify({ providerRefundId }),
  }));
  return handleResponse(response);
};

export const failRefund = async (id: number, error: string): Promise<RefundDto> => {
  const response = await fetch(`${BASE_URL}/${id}/fail`, withLangHeaders({
    method: 'POST',
    headers: defaultHeaders as HeadersInit,
    body: JSON.stringify({ error }),
  }));
  return handleResponse(response);
};

// Notes and Notification
export const addRefundNotes = async (id: number, notes: string): Promise<RefundDto> => {
  const response = await fetch(`${BASE_URL}/${id}/notes`, withLangHeaders({
    method: 'POST',
    headers: defaultHeaders as HeadersInit,
    body: JSON.stringify({ notes }),
  }));
  return handleResponse(response);
};

export const markCustomerNotified = async (id: number): Promise<RefundDto> => {
  const response = await fetch(`${BASE_URL}/${id}/notify`, withLangHeaders({
    method: 'POST',
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

// Statistics
export const getRefundStats = async (): Promise<RefundStatsDto> => {
  const response = await fetch(`${BASE_URL}/stats`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getRefundsProcessedByUser = async (
  userId: number,
  page: number = 0,
  size: number = 20
): Promise<Page<RefundDto>> => {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
  const response = await fetch(`${BASE_URL}/processed-by/${userId}?${params}`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

// Enums
export const getRefundStatuses = async (): Promise<RefundStatus[]> => {
  const response = await fetch(`${BASE_URL}/statuses`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

export const getRefundReasons = async (): Promise<RefundReason[]> => {
  const response = await fetch(`${BASE_URL}/reasons`, withLangHeaders({
    headers: defaultHeaders as HeadersInit,
  }));
  return handleResponse(response);
};

// ==================== Helper Functions ====================

export const getStatusLabel = (status: RefundStatus): string => {
  const labels: Record<RefundStatus, string> = {
    PENDING: 'Čaká na schválenie',
    APPROVED: 'Schválený',
    PROCESSING: 'Spracováva sa',
    COMPLETED: 'Dokončený',
    FAILED: 'Zlyhalo',
    REJECTED: 'Zamietnutý',
    CANCELLED: 'Zrušený'
  };
  return labels[status] || status;
};

export const getStatusColor = (status: RefundStatus): string => {
  const colors: Record<RefundStatus, string> = {
    PENDING: '#f59e0b',
    APPROVED: '#3b82f6',
    PROCESSING: '#8b5cf6',
    COMPLETED: '#10b981',
    FAILED: '#ef4444',
    REJECTED: '#6b7280',
    CANCELLED: '#9ca3af'
  };
  return colors[status] || '#6b7280';
};

export const getReasonLabel = (reason: RefundReason): string => {
  const labels: Record<RefundReason, string> = {
    CUSTOMER_REQUEST: 'Žiadosť zákazníka',
    PRODUCT_DEFECTIVE: 'Chybný produkt',
    PRODUCT_NOT_AS_DESCRIBED: 'Produkt nezodpovedá popisu',
    WRONG_ITEM_SENT: 'Zaslaná nesprávna položka',
    ORDER_CANCELLED: 'Zrušená objednávka',
    DUPLICATE_ORDER: 'Duplicitná objednávka',
    SHIPPING_ISSUE: 'Problém s dopravou',
    NEVER_RECEIVED: 'Nedoručené',
    PARTIAL_ORDER: 'Čiastočná objednávka',
    PRICE_ADJUSTMENT: 'Úprava ceny',
    GOODWILL: 'Gesto dobrej vôle',
    OTHER: 'Iný dôvod'
  };
  return labels[reason] || reason;
};

export const formatAmount = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'práve teraz';
  if (diffMins < 60) return `pred ${diffMins} min`;
  if (diffHours < 24) return `pred ${diffHours} h`;
  if (diffDays < 7) return `pred ${diffDays} d`;
  return formatDateTime(dateString);
};

export const canEdit = (refund: RefundDto): boolean => {
  return refund.status === 'PENDING';
};

export const canApprove = (refund: RefundDto): boolean => {
  return refund.status === 'PENDING';
};

export const canReject = (refund: RefundDto): boolean => {
  return refund.status === 'PENDING';
};

export const canExecute = (refund: RefundDto): boolean => {
  return refund.status === 'APPROVED';
};

export const canCancel = (refund: RefundDto): boolean => {
  return refund.status === 'PENDING' || refund.status === 'APPROVED';
};

export const canDelete = (refund: RefundDto): boolean => {
  return refund.status === 'PENDING' || refund.status === 'CANCELLED';
};
