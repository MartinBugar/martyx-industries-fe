/**
 * Account Lockout Configuration Service
 *
 * Handles admin configuration for account lockout security settings.
 *
 * Features:
 * - Get current lockout configuration
 * - Update lockout settings (admin only)
 * - Manage max failed attempts, lockout duration, etc.
 * - View locked users
 * - Manually unlock/lock user accounts
 */

import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

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

export interface LockedUserDto {
    userId: number;
    email: string;
    firstName?: string;
    lastName?: string;
    failedLoginAttempts?: number;
    lastFailedLogin?: string;
    lastFailedLoginIp?: string;
    lockedUntil?: string;
    currentlyLocked: boolean;
    createdAt?: string;
    lastActivityAt?: string;
}

/**
 * Admin service for managing account lockout configuration.
 * Provides configuration operations for account lockout security.
 * Requires ADMIN role for all operations.
 */
export const accountLockoutConfigService = {
    /**
     * Get current account lockout configuration (admin only).
     * GET /api/admin/account-lockout-config
     *
     * @returns Current configuration settings
     */
    async getAdminConfig(): Promise<AccountLockoutConfigDto> {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/account-lockout-config`,
            withLangHeaders({
                method: 'GET',
                headers: defaultHeaders as HeadersInit,
            })
        );
        return await handleResponse(response) as AccountLockoutConfigDto;
    },

    /**
     * Update account lockout configuration (admin only).
     * PUT /api/admin/account-lockout-config
     *
     * @param request Updated configuration
     * @returns Updated configuration
     */
    async updateConfig(request: AccountLockoutConfigUpdateRequest): Promise<AccountLockoutConfigDto> {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/account-lockout-config`,
            withLangHeaders({
                method: 'PUT',
                headers: defaultHeaders as HeadersInit,
                body: JSON.stringify(request),
            })
        );
        return await handleResponse(response) as AccountLockoutConfigDto;
    },

    /**
     * Get list of currently locked users (admin only).
     * GET /api/admin/account-lockout-config/locked-users
     *
     * @returns List of locked users
     */
    async getLockedUsers(): Promise<LockedUserDto[]> {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/account-lockout-config/locked-users`,
            withLangHeaders({
                method: 'GET',
                headers: defaultHeaders as HeadersInit,
            })
        );
        return await handleResponse(response) as LockedUserDto[];
    },

    /**
     * Get list of users with failed login attempts (admin only).
     * GET /api/admin/account-lockout-config/users-with-failures
     *
     * @returns List of users with failed attempts
     */
    async getUsersWithFailedAttempts(): Promise<LockedUserDto[]> {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/account-lockout-config/users-with-failures`,
            withLangHeaders({
                method: 'GET',
                headers: defaultHeaders as HeadersInit,
            })
        );
        return await handleResponse(response) as LockedUserDto[];
    },

    /**
     * Manually unlock a user account (admin only).
     * POST /api/admin/account-lockout-config/unlock/{userId}
     *
     * @param userId User ID to unlock
     * @returns Success message
     */
    async unlockUser(userId: number): Promise<{ message: string }> {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/account-lockout-config/unlock/${userId}`,
            withLangHeaders({
                method: 'POST',
                headers: defaultHeaders as HeadersInit,
            })
        );
        return await handleResponse(response) as { message: string };
    },

    /**
     * Manually lock a user account (admin only).
     * POST /api/admin/account-lockout-config/lock/{userId}?durationMinutes={duration}
     *
     * @param userId User ID to lock
     * @param durationMinutes Lock duration in minutes (default: 30)
     * @returns Success message
     */
    async lockUser(userId: number, durationMinutes: number = 30): Promise<{ message: string }> {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/account-lockout-config/lock/${userId}?durationMinutes=${durationMinutes}`,
            withLangHeaders({
                method: 'POST',
                headers: defaultHeaders as HeadersInit,
            })
        );
        return await handleResponse(response) as { message: string };
    },
};
