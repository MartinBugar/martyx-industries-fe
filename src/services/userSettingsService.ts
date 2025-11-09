// User Settings Service - Communication with backend User Settings API
import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

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
 * User Settings Service for managing user preferences and gamification data
 */
export const userSettingsService = {
    /**
     * Get current user settings (UI preferences, gamification data)
     */
    getUserSettings: async (): Promise<{
        particlesEnabled: boolean;
        totalXp: number;
    }> => {
        const response = await fetch(`${API_BASE_URL}/api/gamification/settings`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Update particles enabled setting
     */
    updateParticlesEnabled: async (particlesEnabled: boolean): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/api/gamification/settings/particles`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ particlesEnabled }),
        });
        return handleResponse(response);
    },
};
