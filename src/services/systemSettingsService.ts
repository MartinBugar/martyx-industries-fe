/**
 * System Settings Service
 *
 * API endpoints:
 * - Admin: GET /api/admin/system-settings (ADMIN role)
 * - Admin: PUT /api/admin/system-settings (ADMIN role)
 */

import { apiClient } from './apiClient';

export interface SystemSettingsDto {
  id?: number;
  devGateEnabled: boolean;
  devGatePassword: string;
  // OSS/Tax Configuration (V111)
  ossEnabled?: boolean;
  defaultVatRate?: number;
  sellerCountryCode?: string;
  ossThresholdEur?: number;
}

const ADMIN_API_BASE = '/api/admin/system-settings';

export const systemSettingsService = {
  /**
   * Get system settings (ADMIN - auth required).
   */
  async getSettings(): Promise<SystemSettingsDto> {
    return await apiClient.get<SystemSettingsDto>(ADMIN_API_BASE);
  },

  /**
   * Update system settings (ADMIN only).
   */
  async updateSettings(settings: SystemSettingsDto): Promise<SystemSettingsDto> {
    return await apiClient.put<SystemSettingsDto>(ADMIN_API_BASE, settings);
  },
};
