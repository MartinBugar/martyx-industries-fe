/**
 * Status Badge Utilities
 *
 * Unified badge variant helpers for consistent status display across admin pages.
 */

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'info';

/**
 * Get badge variant for order status.
 */
export const getOrderStatusVariant = (status: string): BadgeVariant => {
  const statusLower = status?.toLowerCase() || '';

  switch (statusLower) {
    case 'pending':
    case 'pending_payment':
      return 'warning';
    case 'paid':
    case 'completed':
      return 'success';
    case 'shipped':
    case 'processing':
      return 'primary';
    case 'delivered':
      return 'success';
    case 'cancelled':
    case 'refunded':
    case 'failed':
      return 'danger';
    default:
      return 'secondary';
  }
};

/**
 * Get badge variant for discount/coupon status.
 */
export const getDiscountStatusVariant = (status: string): BadgeVariant => {
  const statusLower = status?.toLowerCase() || '';

  switch (statusLower) {
    case 'active':
      return 'success';
    case 'scheduled':
      return 'info';
    case 'expired':
      return 'secondary';
    case 'disabled':
    case 'inactive':
      return 'danger';
    default:
      return 'secondary';
  }
};

/**
 * Get badge variant for ticket status.
 */
export const getTicketStatusVariant = (status: string): BadgeVariant => {
  const statusLower = status?.toLowerCase() || '';

  switch (statusLower) {
    case 'open':
    case 'new':
      return 'primary';
    case 'in_progress':
    case 'pending':
      return 'warning';
    case 'resolved':
    case 'closed':
      return 'success';
    case 'escalated':
      return 'danger';
    default:
      return 'secondary';
  }
};

/**
 * Get badge variant for user account status.
 */
export const getUserStatusVariant = (status: string): BadgeVariant => {
  const statusLower = status?.toLowerCase() || '';

  switch (statusLower) {
    case 'active':
    case 'verified':
      return 'success';
    case 'pending':
    case 'unverified':
      return 'warning';
    case 'suspended':
    case 'banned':
    case 'inactive':
      return 'danger';
    default:
      return 'secondary';
  }
};

/**
 * Get badge variant for product status.
 */
export const getProductStatusVariant = (status: string): BadgeVariant => {
  const statusLower = status?.toLowerCase() || '';

  switch (statusLower) {
    case 'active':
    case 'published':
    case 'in_stock':
      return 'success';
    case 'draft':
    case 'pending':
      return 'warning';
    case 'out_of_stock':
    case 'low_stock':
      return 'danger';
    case 'discontinued':
    case 'archived':
      return 'secondary';
    default:
      return 'secondary';
  }
};

/**
 * Get badge variant for refund status.
 */
export const getRefundStatusVariant = (status: string): BadgeVariant => {
  const statusLower = status?.toLowerCase() || '';

  switch (statusLower) {
    case 'pending':
    case 'requested':
      return 'warning';
    case 'approved':
    case 'processing':
      return 'primary';
    case 'completed':
    case 'refunded':
      return 'success';
    case 'rejected':
    case 'failed':
      return 'danger';
    default:
      return 'secondary';
  }
};

/**
 * Get badge variant for shipment status.
 */
export const getShipmentStatusVariant = (status: string): BadgeVariant => {
  const statusLower = status?.toLowerCase() || '';

  switch (statusLower) {
    case 'pending':
    case 'preparing':
      return 'warning';
    case 'shipped':
    case 'in_transit':
      return 'primary';
    case 'delivered':
      return 'success';
    case 'returned':
    case 'failed':
      return 'danger';
    default:
      return 'secondary';
  }
};

/**
 * Get badge variant for generic boolean active state.
 */
export const getActiveStatusVariant = (isActive: boolean): BadgeVariant => {
  return isActive ? 'success' : 'secondary';
};

/**
 * Get human-readable label for order status.
 */
export const getOrderStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    pending_payment: 'Pending Payment',
    paid: 'Paid',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    failed: 'Failed',
  };

  return labels[status?.toLowerCase()] || status || 'Unknown';
};
