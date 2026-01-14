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
  // 3D Model Configuration (V114)
  autoRotate3DModel?: boolean;
  // UI Visibility Settings (V141)
  cassandraTabEnabled?: boolean;
}

const ADMIN_API_BASE = '/api/admin/system-settings';
const PUBLIC_DISPLAY_SETTINGS_BASE = '/api/v1/public/display-settings';
const PUBLIC_UI_SETTINGS_BASE = '/api/public/ui-settings';

export interface DisplaySettings3DModel {
  autoRotate: boolean;
}

export interface UiVisibilitySettings {
  cassandraTabEnabled: boolean;
}

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

  /**
   * Get public 3D model display settings (no auth required).
   */
  async get3DModelSettings(): Promise<DisplaySettings3DModel> {
    return await apiClient.get<DisplaySettings3DModel>(`${PUBLIC_DISPLAY_SETTINGS_BASE}/3d-model`);
  },

  /**
   * Get public UI visibility settings (no auth required).
   * Used to check which UI elements should be visible.
   */
  async getUiVisibilitySettings(): Promise<UiVisibilitySettings> {
    return await apiClient.get<UiVisibilitySettings>(PUBLIC_UI_SETTINGS_BASE);
  },

  /**
   * Check if Cassandra tab is enabled (no auth required).
   */
  async isCassandraTabEnabled(): Promise<boolean> {
    return await apiClient.get<boolean>(`${PUBLIC_UI_SETTINGS_BASE}/cassandra-tab`);
  },
};
