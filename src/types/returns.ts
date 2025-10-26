/**
 * RMA (Return Merchandise Authorization) Type Definitions
 * Corresponds to backend DTOs for product returns, exchanges, and repairs
 */

/**
 * Return Type enum
 */
export const ReturnType = {
  REFUND: 'REFUND',
  EXCHANGE: 'EXCHANGE',
  REPAIR: 'REPAIR'
} as const;
export type ReturnType = typeof ReturnType[keyof typeof ReturnType];

/**
 * Return Status enum
 */
export const ReturnStatus = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RECEIVED: 'RECEIVED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;
export type ReturnStatus = typeof ReturnStatus[keyof typeof ReturnStatus];

/**
 * Return Reason enum
 */
export const ReturnReason = {
  DEFECTIVE: 'DEFECTIVE',
  WRONG_ITEM: 'WRONG_ITEM',
  NOT_AS_DESCRIBED: 'NOT_AS_DESCRIBED',
  CHANGED_MIND: 'CHANGED_MIND',
  DAMAGED_IN_SHIPPING: 'DAMAGED_IN_SHIPPING',
  OTHER: 'OTHER'
} as const;
export type ReturnReason = typeof ReturnReason[keyof typeof ReturnReason];

/**
 * Refund Method enum
 */
export const RefundMethod = {
  ORIGINAL_PAYMENT: 'ORIGINAL_PAYMENT',
  STORE_CREDIT: 'STORE_CREDIT',
  BANK_TRANSFER: 'BANK_TRANSFER'
} as const;
export type RefundMethod = typeof RefundMethod[keyof typeof RefundMethod];

/**
 * Return Request details
 * Complete information about a product return, exchange, or repair request
 */
export interface ReturnRequestDto {
  id: number;
  rma_number: string;
  order_id: number;
  order_number?: string;
  user_id: number;
  user_email?: string;
  return_type: string; // ReturnType enum value
  return_status: string; // ReturnStatus enum value
  return_reason: string; // ReturnReason enum value
  return_items: string; // JSON array of items
  customer_notes?: string;
  customer_images?: string[];
  refund_amount?: number;
  refund_method?: string; // RefundMethod enum value
  refund_processed_at?: string; // ISO date string
  refund_transaction_id?: string;
  return_shipping_carrier?: string;
  return_tracking_number?: string;
  return_label_url?: string;
  return_shipping_cost?: number;
  customer_pays_shipping?: boolean;
  received_at?: string; // ISO date string
  inspected_at?: string; // ISO date string
  inspection_notes?: string;
  approved_by?: number;
  approved_at?: string; // ISO date string
  rejected_reason?: string;
  items_restocked?: boolean;
  restocked_at?: string; // ISO date string
  restocking_fee?: number;
  requested_at: string; // ISO date string
  updated_at: string; // ISO date string
  completed_at?: string; // ISO date string
  cancelled_at?: string; // ISO date string
  ip_address?: string;
}

/**
 * Return Request creation DTO
 * Request DTO for initiating a product return, exchange, or repair
 */
export interface ReturnRequestCreateDto {
  order_id: number;
  return_type: string; // ReturnType enum value
  return_reason: string; // ReturnReason enum value
  return_items: string; // JSON array: [{order_item_id, quantity, reason}]
  customer_notes?: string;
  customer_images?: string[];
  refund_method?: string; // RefundMethod enum value
}

/**
 * Return Request update DTO
 * Admin/System update DTO for return request processing
 */
export interface ReturnRequestUpdateDto {
  return_status?: string; // ReturnStatus enum value
  return_shipping_carrier?: string;
  return_tracking_number?: string;
  return_label_url?: string;
  return_shipping_cost?: number;
  customer_pays_shipping?: boolean;
  received_at?: string; // ISO date string
  inspected_at?: string; // ISO date string
  inspection_notes?: string;
  rejected_reason?: string;
  refund_amount?: number;
  refund_processed_at?: string; // ISO date string
  refund_transaction_id?: string;
  items_restocked?: boolean;
  restocked_at?: string; // ISO date string
  restocking_fee?: number;
}

/**
 * RMA Approval/Rejection DTO
 * Admin DTO for approving or rejecting a return request
 */
export interface RmaApprovalDto {
  action: string; // 'APPROVE' or 'REJECT'
  refund_amount?: number;
  refund_method?: string; // RefundMethod enum value
  restocking_fee?: number;
  customer_pays_shipping?: boolean;
  rejection_reason?: string;
  internal_notes?: string;
  send_email_notification?: boolean;
}
