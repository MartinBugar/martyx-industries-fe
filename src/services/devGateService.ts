/**
 * Development Gate Service
 *
 * API endpoints:
 * - Public: GET /api/dev-gate/status (no auth)
 * - Public: POST /api/dev-gate/validate (no auth)
 */

import { apiClient } from './apiClient';

export interface DevGateStatusResponse {
  enabled: boolean;
}

export interface DevGateValidateRequest {
  password: string;
}

export interface DevGateValidateResponse {
  valid: boolean;
}

const API_BASE = '/api/dev-gate';

export const devGateService = {
  /**
   * Check if dev gate is enabled (PUBLIC - no auth required).
   */
  async getStatus(): Promise<DevGateStatusResponse> {
    return await apiClient.get<DevGateStatusResponse>(`${API_BASE}/status`);
  },

  /**
   * Validate dev gate password (PUBLIC - no auth required).
   */
  async validatePassword(password: string): Promise<DevGateValidateResponse> {
    return await apiClient.post<DevGateValidateResponse>(`${API_BASE}/validate`, { password });
  },
};
