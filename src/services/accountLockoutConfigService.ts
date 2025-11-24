/**
 * Account Lockout Configuration Service
 *
 * Handles admin configuration for account lockout security settings.
 *
 * Features:
 * - Get current lockout configuration
 * - Update lockout settings (admin only)
 * - Manage max failed attempts, lockout duration, etc.
 */

import api from './api';

export interface AccountLockoutConfigDto {
    id: number;
    maxFailedAttempts: number;
    lockoutDurationMinutes: number;
    attemptResetHours: number;
    lockoutEnabled: boolean;
    createdAt: string;
    updatedAt: string;
    updatedBy?: string;
}

export interface AccountLockoutConfigUpdateRequest {
    maxFailedAttempts: number;
    lockoutDurationMinutes: number;
    attemptResetHours: number;
    lockoutEnabled: boolean;
}

class AccountLockoutConfigService {
    private readonly BASE_URL = '/api/admin/account-lockout-config';

    /**
     * Get current account lockout configuration (admin only).
     *
     * @returns Current configuration settings
     */
    async getAdminConfig(): Promise<AccountLockoutConfigDto> {
        const response = await api.get<AccountLockoutConfigDto>(this.BASE_URL);
        return response.data;
    }

    /**
     * Update account lockout configuration (admin only).
     *
     * @param request Updated configuration
     * @returns Updated configuration
     */
    async updateConfig(request: AccountLockoutConfigUpdateRequest): Promise<AccountLockoutConfigDto> {
        const response = await api.put<AccountLockoutConfigDto>(this.BASE_URL, request);
        return response.data;
    }
}

export const accountLockoutConfigService = new AccountLockoutConfigService();
