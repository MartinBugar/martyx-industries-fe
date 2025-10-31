import { authApi, setAuthToken } from '../services/api';
import { secureLocalStorage } from './security';

/**
 * Token refresh utility
 * Handles automatic refresh of access tokens before expiration
 */

let refreshInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start auto-refresh timer
 * Refreshes access token 5 minutes before expiration (every 25 minutes for 30 min tokens)
 */
export const startTokenRefresh = () => {
  // Clear existing interval if any
  stopTokenRefresh();

  // Refresh every 25 minutes (5 minutes before 30 minute expiration)
  refreshInterval = setInterval(async () => {
    await refreshAccessToken();
  }, 25 * 60 * 1000); // 25 minutes

  console.log('🔄 Token auto-refresh started (every 25 minutes)');
};

/**
 * Stop auto-refresh timer
 */
export const stopTokenRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('⏸️ Token auto-refresh stopped');
  }
};

/**
 * Manually refresh access token
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = secureLocalStorage.get('refreshToken', null);

    if (!refreshToken) {
      console.warn('⚠️ No refresh token found, cannot refresh access token');
      return false;
    }

    console.log('🔄 Refreshing access token...');
    const response = await authApi.refreshToken(refreshToken);

    // Update access token
    const newAccessToken = response.token;
    secureLocalStorage.set('token', newAccessToken);
    localStorage.setItem('token', JSON.stringify(newAccessToken));
    setAuthToken(newAccessToken);

    // If backend returned new refresh token, update it too
    if (response.refreshToken) {
      secureLocalStorage.set('refreshToken', response.refreshToken);
      localStorage.setItem('refreshToken', JSON.stringify(response.refreshToken));
    }

    console.log('✅ Access token refreshed successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to refresh access token:', error);

    // If refresh fails (invalid/expired refresh token), trigger logout
    // Dispatch custom event for AuthProvider to handle
    window.dispatchEvent(new CustomEvent('auth:logout', {
      detail: { reason: 'refresh_token_expired' }
    }));

    return false;
  }
};

/**
 * Check if token needs refresh soon
 * Returns true if token expires in less than 5 minutes
 */
export const shouldRefreshToken = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = exp - now;

    // Refresh if less than 5 minutes until expiry
    return timeUntilExpiry < 5 * 60 * 1000;
  } catch (error) {
    console.error('Failed to parse token:', error);
    return true; // Refresh to be safe
  }
};
