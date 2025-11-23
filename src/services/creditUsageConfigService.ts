/**
 * Credit Usage Configuration Service
 *
 * API endpoints:
 * - Public: GET /api/public/credit-usage-config (no auth)
 * - Admin:  GET /api/admin/credit-usage-config (ADMIN role)
 * - Admin:  PUT /api/admin/credit-usage-config (ADMIN role)
 */

import { apiClient } from './apiUtils';

export interface CreditUsageConfigDto {
  id: number; // Always 1 (singleton)
  minOrderValueForCredits: number; // €20.00
  maxCreditPercentage: number; // 0.5000 = 50%
  allowCreditsWithDiscounts: boolean;
  creditsEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

const PUBLIC_API_BASE = '/api/public/credit-usage-config';
const ADMIN_API_BASE = '/api/admin/credit-usage-config';

export const creditUsageConfigService = {
  /**
   * Get credit usage configuration (PUBLIC - no auth required).
   * Used by frontend for UX validation in checkout.
   */
  async getPublicConfig(): Promise<CreditUsageConfigDto> {
    const response = await apiClient.get<CreditUsageConfigDto>(PUBLIC_API_BASE);
    return response.data;
  },

  /**
   * Get credit usage configuration (ADMIN - auth required).
   * Includes audit fields (createdAt, updatedBy, etc.)
   */
  async getAdminConfig(): Promise<CreditUsageConfigDto> {
    const response = await apiClient.get<CreditUsageConfigDto>(ADMIN_API_BASE);
    return response.data;
  },

  /**
   * Update credit usage configuration (ADMIN only).
   */
  async updateConfig(
    config: Omit<CreditUsageConfigDto, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>
  ): Promise<CreditUsageConfigDto> {
    const response = await apiClient.put<CreditUsageConfigDto>(ADMIN_API_BASE, config);
    return response.data;
  },
};
