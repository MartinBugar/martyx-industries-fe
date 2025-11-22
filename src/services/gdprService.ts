// GDPR Service - Communication with backend GDPR API
import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

// Type definitions for GDPR data structures
export interface ConsentHistoryItem {
    consentType: string;
    consentValue: boolean;
    actionType: string;
    consentDate: string;
    ipAddress: string | null;
}

export interface DataExportRequest {
    requestDate: string;
    status: string;
}

/**
 * Get auth headers with JWT token
 * Uses defaultHeaders from apiUtils which already handles token parsing correctly
 */
const getAuthHeaders = (): HeadersInit => {
    return {
        ...defaultHeaders,
    } as HeadersInit;
};

/**
 * GDPR Service for managing user consent, data export, and account deletion
 * Implements GDPR Articles 7, 15, and 17
 */
export const gdprService = {
    // =========================================================================
    // CONSENT MANAGEMENT (GDPR Article 7)
    // =========================================================================

    /**
     * Get current consent status for authenticated user
     */
    getConsentStatus: async (): Promise<{
        gdpr: boolean;
        marketing: boolean;
        confirmed: boolean;
    }> => {
        const response = await fetch(`${API_BASE_URL}/api/gdpr/consent/status`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get consent history for authenticated user
     */
    getConsentHistory: async (): Promise<ConsentHistoryItem[]> => {
        const response = await fetch(`${API_BASE_URL}/api/gdpr/consent/history`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Withdraw marketing consent (GDPR Article 7(3) - Right to withdraw consent)
     */
    withdrawMarketingConsent: async (): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/api/gdpr/consent/withdraw-marketing`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Grant marketing consent (GDPR Article 7 - Consent)
     * Allows users to re-enable marketing consent after withdrawing it
     */
    grantMarketingConsent: async (): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/api/gdpr/consent/grant-marketing`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    // =========================================================================
    // DATA EXPORT (GDPR Article 15 - Right to Access)
    // =========================================================================

    /**
     * Request data export (GDPR Article 15 - Right to Access)
     * User will receive email when export is ready
     */
    requestDataExport: async (): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/api/gdpr/consent/data-export/request`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get data export request history
     */
    getDataExportHistory: async (): Promise<DataExportRequest[]> => {
        const response = await fetch(`${API_BASE_URL}/api/gdpr/consent/data-export/history`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Download data export (immediate export)
     * Downloads all user data as JSON file
     */
    downloadDataExport: async (): Promise<Record<string, unknown>> => {
        const response = await fetch(`${API_BASE_URL}/api/gdpr/consent/data-export/download`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        const data = await handleResponse(response) as Record<string, unknown>;

        // Trigger download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gdpr-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return data;
    },

    // =========================================================================
    // ACCOUNT DELETION (GDPR Article 17 - Right to Erasure)
    // =========================================================================

    /**
     * Delete user account (GDPR Article 17 - Right to Erasure / Right to be Forgotten)
     * @param confirmationEmail - Email address for confirmation (security measure)
     */
    deleteAccount: async (confirmationEmail: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/api/gdpr/consent/account/delete`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ confirmationEmail }),
        });
        return handleResponse(response);
    },
};
