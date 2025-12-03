/**
 * Inventory Management Type Definitions
 * Corresponds to backend DTOs for stock movements and alerts
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
 * Inventory Item DTO
 * Combines product variant with stock information for inventory list
 */
export interface InventoryItemDto {
  variantId: number;
  sku: string;
  variantName: string;
  masterProductId?: number;
  masterProductName?: string;
  category?: string;
  priceWithVat: number;
  currency: string;
  stockQuantity: number;
  trackInventory: boolean;
  availabilityStatus: string; // IN_STOCK, LOW_STOCK, OUT_OF_STOCK, PRE_ORDER, DISCONTINUED, BACKORDERED
  lowStockThreshold?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  active: boolean;
  reservedQuantity: number;
  availableQuantity: number;
  imageUrl?: string;
}
