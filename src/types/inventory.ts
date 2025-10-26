/**
 * Inventory Management Type Definitions
 * Corresponds to backend DTOs for stock movements, alerts, suppliers, and purchase orders
 */

/**
 * Movement Type enum
 */
export const MovementType = {
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
  RETURN: 'RETURN',
  ADJUSTMENT: 'ADJUSTMENT',
  RESTOCK: 'RESTOCK',
  DAMAGE: 'DAMAGE',
  THEFT: 'THEFT',
  TRANSFER: 'TRANSFER',
  CORRECTION: 'CORRECTION',
  INITIAL_STOCK: 'INITIAL_STOCK'
} as const;
export type MovementType = typeof MovementType[keyof typeof MovementType];

/**
 * Alert Type enum
 */
export const AlertType = {
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  OVERSTOCK: 'OVERSTOCK'
} as const;
export type AlertType = typeof AlertType[keyof typeof AlertType];

/**
 * Alert Status enum
 */
export const AlertStatus = {
  ACTIVE: 'ACTIVE',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED'
} as const;
export type AlertStatus = typeof AlertStatus[keyof typeof AlertStatus];

/**
 * Purchase Order Status enum
 */
export const PurchaseOrderStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  CONFIRMED: 'CONFIRMED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED'
} as const;
export type PurchaseOrderStatus = typeof PurchaseOrderStatus[keyof typeof PurchaseOrderStatus];

/**
 * Payment Status enum
 */
export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID'
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

/**
 * Stock Movement record
 * Complete audit trail for inventory changes
 */
export interface StockMovementDto {
  id: number;
  product_id: number;
  product_name?: string;
  variant_id?: number;
  variant_name?: string;
  master_product_id?: number;
  movement_type: string; // MovementType enum value
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  order_id?: number;
  order_number?: string;
  order_item_id?: number;
  return_request_id?: number;
  supplier_order_id?: number;
  unit_cost?: number;
  total_cost?: number;
  location?: string;
  warehouse_location?: string;
  reason?: string; // SOLD, RETURNED, DAMAGED, EXPIRED, RESTOCKED, CORRECTED, STOLEN, TRANSFERRED, INITIAL, OTHER
  notes?: string;
  performed_by?: number;
  performed_by_name?: string;
  performed_by_type?: string; // SYSTEM, ADMIN, CUSTOMER
  movement_date: string; // ISO date string
  created_at: string; // ISO date string
}

/**
 * Stock Alert details
 * Alerts for low stock, out of stock, or overstock situations
 */
export interface StockAlertDto {
  id: number;
  product_id: number;
  product_name?: string;
  variant_id?: number;
  variant_name?: string;
  alert_type: string; // AlertType enum value
  alert_status: string; // AlertStatus enum value
  current_quantity: number;
  threshold_quantity: number;
  notified_at?: string; // ISO date string
  notification_sent?: boolean;
  acknowledged_by?: number;
  acknowledged_by_name?: string;
  acknowledged_at?: string; // ISO date string
  resolved_at?: string; // ISO date string
  resolution_notes?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Supplier details
 * Supplier information for inventory purchases and restocking
 */
export interface SupplierDto {
  id: number;
  supplier_name: string;
  supplier_code: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  country_code?: string;
  company_id?: string;
  tax_id?: string;
  vat_id?: string;
  payment_terms?: string;
  payment_method?: string;
  supplier_rating?: number;
  total_orders?: number;
  is_active: boolean;
  notes?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Purchase Order details
 * Purchase order for restocking inventory from suppliers
 */
export interface PurchaseOrderDto {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name?: string;
  supplier_code?: string;
  order_status: string; // PurchaseOrderStatus enum value
  order_date: string; // ISO date string (LocalDate)
  expected_delivery_date?: string; // ISO date string (LocalDate)
  actual_delivery_date?: string; // ISO date string (LocalDate)
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  payment_status: string; // PaymentStatus enum value
  payment_date?: string; // ISO date string (LocalDate)
  notes?: string;
  internal_notes?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Purchase Order creation DTO
 * Request DTO for creating new purchase orders
 */
export interface PurchaseOrderCreateDto {
  po_number: string;
  supplier_id: number;
  order_status: string; // PurchaseOrderStatus enum value
  order_date: string; // ISO date string (LocalDate)
  expected_delivery_date?: string; // ISO date string (LocalDate)
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  payment_status?: string; // PaymentStatus enum value
  notes?: string;
  internal_notes?: string;
  items?: string; // JSON array: [{product_id, variant_id, quantity, unit_cost}]
}
