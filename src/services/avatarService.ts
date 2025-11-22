import { API_BASE_URL, defaultHeaders, withLangHeaders } from './apiUtils';
import { logInfo, logWarn, logError } from '../services/logger';

export interface Avatar {
  id: number;
  name: string;
  imageUrl: string;
  description: string;
  active: boolean;
}

export const avatarService = {
  /**
   * Get all active avatars
   */
  async getAllAvatars(): Promise<Avatar[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/avatars`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      if (response.ok) {
        return await response.json();
      }

      throw new Error('Failed to fetch avatars');
    } catch (error) {
      logError('Error fetching avatars:', error);
      throw error;
    }
  },

  /**
   * Update current user's avatar
   */
  async updateUserAvatar(avatarId: number): Promise<void> {
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
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${API_BASE_URL}/api/users/me/avatar`, withLangHeaders({
        method: 'PUT',
        headers: headers as HeadersInit,
        body: JSON.stringify({ avatarId })
      }));

      if (!response.ok) {
        throw new Error('Failed to update avatar');
      }
    } catch (error) {
      logError('Error updating avatar:', error);
      throw error;
    }
  }
};
