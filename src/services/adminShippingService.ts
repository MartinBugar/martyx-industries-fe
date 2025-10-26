import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type {
  ShippingZoneDto,
  ShippingRateDto
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
};
