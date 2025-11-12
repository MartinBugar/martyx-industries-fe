import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type {
  ShippingZoneDto,
  ShippingRateDto,
  CreateShipmentRequest,
  CreateShipmentResponse,
  Shipment,
  ShipmentTracking,
  ShipmentStatus
} from '../types/shipping';

/**
 * Service for admin shipping zone and rate management operations
 */

const jsonHeaders = () => defaultHeaders as HeadersInit;

export const adminShippingService = {
  // ===== Shipping Zones Management =====

  /**
   * Get all shipping zones
   * @returns List of all shipping zones
   */
  async getAllZones(): Promise<ShippingZoneDto[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/zones`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ShippingZoneDto[];
  },

  /**
   * Get shipping zone details by ID
   * @param id - Zone ID
   * @returns Zone details
   */
  async getZoneById(id: number): Promise<ShippingZoneDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/zones/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ShippingZoneDto;
  },

  /**
   * Create a new shipping zone
   * @param dto - Zone creation data
   * @returns Created zone
   */
  async createZone(dto: ShippingZoneDto): Promise<ShippingZoneDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/zones`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    });

    return await handleResponse(resp) as ShippingZoneDto;
  },

  /**
   * Update an existing shipping zone
   * @param id - Zone ID
   * @param dto - Updated zone data
   * @returns Updated zone
   */
  async updateZone(id: number, dto: ShippingZoneDto): Promise<ShippingZoneDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/zones/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    });

    return await handleResponse(resp) as ShippingZoneDto;
  },

  /**
   * Delete a shipping zone
   * @param id - Zone ID
   * @returns Success response
   */
  async deleteZone(id: number): Promise<{ message: string }> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/zones/${id}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp);
  },

  /**
   * Get all rates for a specific shipping zone
   * @param id - Zone ID
   * @returns List of rates
   */
  async getRatesForZone(id: number): Promise<ShippingRateDto[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/zones/${id}/rates`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ShippingRateDto[];
  },

  // ===== Shipping Rates Management =====

  /**
   * Get all shipping rates
   * @returns List of all shipping rates
   */
  async getAllRates(): Promise<ShippingRateDto[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/rates`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ShippingRateDto[];
  },

  /**
   * Get shipping rate details by ID
   * @param id - Rate ID
   * @returns Rate details
   */
  async getRateById(id: number): Promise<ShippingRateDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/rates/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ShippingRateDto;
  },

  /**
   * Create a new shipping rate
   * @param dto - Rate creation data
   * @returns Created rate
   */
  async createRate(dto: ShippingRateDto): Promise<ShippingRateDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/rates`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    });

    return await handleResponse(resp) as ShippingRateDto;
  },

  /**
   * Update an existing shipping rate
   * @param id - Rate ID
   * @param dto - Updated rate data
   * @returns Updated rate
   */
  async updateRate(id: number, dto: ShippingRateDto): Promise<ShippingRateDto> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/rates/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    });

    return await handleResponse(resp) as ShippingRateDto;
  },

  /**
   * Delete a shipping rate
   * @param id - Rate ID
   * @returns Success response
   */
  async deleteRate(id: number): Promise<{ message: string }> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/rates/${id}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp);
  },

  // ===== Shipments Management =====

  /**
   * Create a shipment for an order
   * @param request - Shipment creation request
   * @returns Created shipment response
   */
  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/shipments`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(request),
    });

    return await handleResponse(resp) as CreateShipmentResponse;
  },

  /**
   * Get shipment by ID
   * @param id - Shipment ID
   * @returns Shipment details
   */
  async getShipmentById(id: number): Promise<Shipment> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/shipments/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as Shipment;
  },

  /**
   * Get shipment by order ID
   * @param orderId - Order ID
   * @returns Shipment details
   */
  async getShipmentByOrderId(orderId: number): Promise<Shipment> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/shipments/order/${orderId}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as Shipment;
  },

  /**
   * Get tracking information
   * @param trackingNumber - Tracking number
   * @returns Tracking information
   */
  async getTracking(trackingNumber: string): Promise<ShipmentTracking> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/shipments/tracking/${trackingNumber}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ShipmentTracking;
  },

  /**
   * Update shipment status
   * @param id - Shipment ID
   * @param status - New status
   * @returns Updated shipment
   */
  async updateShipmentStatus(id: number, status: ShipmentStatus): Promise<Shipment> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/shipments/${id}/status?status=${status}`, {
      method: 'PUT',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as Shipment;
  },

  /**
   * Cancel a shipment
   * @param id - Shipment ID
   * @returns Success response
   */
  async cancelShipment(id: number): Promise<{ message: string }> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/shipments/${id}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp);
  },

  /**
   * Get shipments by status
   * @param status - Shipment status
   * @returns List of shipments
   */
  async getShipmentsByStatus(status: ShipmentStatus): Promise<Shipment[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/shipments/status/${status}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as Shipment[];
  },

  /**
   * Refresh tracking for all in-transit shipments
   * @returns Success message
   */
  async refreshAllTracking(): Promise<{ message: string }> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/shipping/shipments/refresh-tracking`, {
      method: 'POST',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp);
  },
};
