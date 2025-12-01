import { logError } from './logger';
// Profile service
import { handleResponse, API_BASE_URL, defaultHeaders, withLangHeaders } from './apiUtils';
import type { User } from '../context/authTypes';

// Type for profile update data
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

// Profile service
export const profileService = {
  // Fetch user profile data - now uses /api/users/me endpoint for authenticated user
  fetchProfile: async (_userId?: string): Promise<Partial<User>> => {
    try {
      // Get token from localStorage
      let token: string | null = null;
      try {
        const tokenRaw = localStorage.getItem('token');
        if (tokenRaw) {
          try {
            token = JSON.parse(tokenRaw);
          } catch {
            token = tokenRaw;
          }
        }
      } catch (e) {
        logError('Failed to get token from localStorage:', e);
      }

      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`,
      };

      // Use /api/users/me endpoint for authenticated user (includes avatar data)
      const response = await fetch(`${API_BASE_URL}/api/users/me`, withLangHeaders({
        method: 'GET',
        headers: headers as HeadersInit,
      }));

      return await handleResponse(response);
    } catch (error) {
      logError('Fetch profile API error:', error);
      throw error;
    }
  },
  
  // Update user profile data - uses /api/users/me for current user (not admin endpoint)
  updateProfile: async (_userId: string, profileData: ProfileUpdateData): Promise<Partial<User>> => {
    try {
      // Get token from localStorage
      let token: string | null = null;
      const tokenRaw = localStorage.getItem('token');
      if (tokenRaw) {
        try {
          token = JSON.parse(tokenRaw);
        } catch {
          token = tokenRaw;
        }
      }

      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`,
      };

      // Use /api/users/me endpoint (not admin /api/users/{id})
      const response = await fetch(`${API_BASE_URL}/api/users/me`, withLangHeaders({
        method: 'PUT',
        headers: headers as HeadersInit,
        credentials: 'include', // Required for CSRF cookie
        body: JSON.stringify(profileData),
      }));

      return await handleResponse(response);
    } catch (error) {
      logError('Update profile API error:', error);
      throw error;
    }
  },

  // Check if current user has username set
  checkHasUsername: async (): Promise<{ hasUsername: boolean; username: string }> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(`${API_BASE_URL}/api/users/me/has-username`, withLangHeaders({
        method: 'GET',
        headers: headers as HeadersInit,
      }));

      return await handleResponse(response);
    } catch (error) {
      logError('Check username API error:', error);
      throw error;
    }
  },

  // Set username for current user
  setUsername: async (username: string): Promise<{ success: boolean; message: string; username: string }> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(`${API_BASE_URL}/api/users/me/username`, withLangHeaders({
        method: 'PUT',
        headers: headers as HeadersInit,
        body: JSON.stringify({ username }),
      }));

      return await handleResponse(response);
    } catch (error) {
      logError('Set username API error:', error);
      throw error;
    }
  },
};