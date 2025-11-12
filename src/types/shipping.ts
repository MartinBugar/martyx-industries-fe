/**
 * Shipping Zone and Rate Type Definitions
 * Corresponds to backend DTOs for shipping calculations and zone management
 */

/**
 * Calculation Method enum
 */
export const CalculationMethod = {
  FLAT_RATE: 'FLAT_RATE',
  WEIGHT_BASED: 'WEIGHT_BASED',
  PRICE_BASED: 'PRICE_BASED',
  FREE: 'FREE'
} as const;
export type CalculationMethod = typeof CalculationMethod[keyof typeof CalculationMethod];

/**
 * Shipping Zone details
 * Geographic shipping zone with country codes and delivery estimates
 */
export interface ShippingZoneDto {
  id: number;
  zone_name: string;
  zone_code: string;
  country_codes: string[];
  priority: number;
  estimated_delivery_days_min?: number;
  estimated_delivery_days_max?: number;
  is_active: boolean;
  description?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Shipping Rate details
 * Shipping rate calculation rules with flat rate, weight-based, or price-based options
 */
export interface ShippingRateDto {
  id: number;
  shipping_zone_id: number;
  shipping_zone_name?: string;
  rate_name: string;
  calculation_method: string; // CalculationMethod enum value
  flat_rate?: number;
  min_weight_kg?: number;
  max_weight_kg?: number;
  price_per_kg?: number;
  base_rate?: number;
  min_order_value?: number;
  max_order_value?: number;
  shipping_cost?: number;
  free_shipping_threshold?: number;
  carrier_name?: string;
  carrier_service?: string;
  delivery_days_min?: number;
  delivery_days_max?: number;
  is_active: boolean;
  description?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Shipping Cost calculation request
 * Request DTO for calculating shipping costs based on destination and order details
 */
export interface ShippingCalculationRequestDto {
  destination_country_code: string;
  destination_city?: string;
  destination_postal_code?: string;
  total_weight_kg: number;
  order_subtotal: number;
  discount_code?: string;
  items_count?: number;
}

/**
 * Shipping Option (nested in ShippingCalculationResponseDto)
 * Represents a single available shipping option
 */
export interface ShippingOptionDto {
  shipping_rate_id: number;
  rate_name: string;
  carrier_name?: string;
  carrier_service?: string;
  shipping_cost: number;
  delivery_days_min?: number;
  delivery_days_max?: number;
  calculation_method: string; // CalculationMethod enum value
  is_recommended?: boolean;
}

/**
 * Shipping Cost calculation response
 * Response DTO containing available shipping options and costs
 */
export interface ShippingCalculationResponseDto {
  shipping_zone_id: number;
  shipping_zone_name: string;
  shipping_zone_code: string;
  available_rates: ShippingOptionDto[];
  free_shipping_eligible: boolean;
  free_shipping_threshold?: number;
  amount_needed_for_free_shipping?: number;
  estimated_delivery_days_min?: number;
  estimated_delivery_days_max?: number;
}

/**
 * Shipment Status enum
 */
export const ShipmentStatus = {
  CREATED: 'CREATED',
  LABEL_GENERATED: 'LABEL_GENERATED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  RETURNED: 'RETURNED',
  CANCELLED: 'CANCELLED'
} as const;
export type ShipmentStatus = typeof ShipmentStatus[keyof typeof ShipmentStatus];

/**
 * Create Shipment Request
 */
export interface CreateShipmentRequest {
  orderId: number;
  carrierName: string;
  carrierService: string;
  weightKg: number;
  shippingCost: number;
  currency?: string;
  isInsured?: boolean;
  insuranceAmount?: number;
  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientPostalCode: string;
  recipientCountryCode: string;
  recipientPhone?: string;
  recipientEmail?: string;
}

/**
 * Create Shipment Response
 */
export interface CreateShipmentResponse {
  shipmentId: number;
  orderId: number;
  trackingNumber: string;
  trackingUrl?: string;
  labelUrl?: string;
  carrierShipmentId?: string;
  status: ShipmentStatus;
  createdAt: string;
  estimatedDeliveryAt?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Shipment details
 */
export interface Shipment {
  id: number;
  order: {
    id: number;
    orderNumber?: string;
  };
  carrierName: string;
  carrierService: string;
  providerType?: string;
  trackingNumber: string;
  trackingUrl?: string;
  labelUrl?: string;
  carrierShipmentId?: string;
  status: ShipmentStatus;
  statusMessage?: string;
  weightKg?: number;
  shippingCost?: number;
  currency?: string;
  isInsured?: boolean;
  insuranceAmount?: number;
  recipientName?: string;
  recipientAddress?: string;
  recipientCity?: string;
  recipientPostalCode?: string;
  recipientCountryCode?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  estimatedDeliveryAt?: string;
  apiRequestPayload?: string;
  apiResponsePayload?: string;
  errorMessage?: string;
}

/**
 * Tracking Event
 */
export interface TrackingEvent {
  timestamp: string;
  status: string;
  description: string;
  location?: string;
}

/**
 * Shipment Tracking
 */
export interface ShipmentTracking {
  shipmentId?: number;
  trackingNumber: string;
  trackingUrl?: string;
  status: string;
  statusMessage?: string;
  lastUpdated?: string;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  carrierName?: string;
  carrierService?: string;
  events?: TrackingEvent[];
}
