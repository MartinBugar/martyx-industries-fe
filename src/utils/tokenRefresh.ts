import { authApi, setAuthToken } from '../services/api';
import { secureLocalStorage } from './security';
import { logInfo, logError } from '../services/logger';

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

  logInfo('🔄 Token auto-refresh started (every 25 minutes)');
};

/**
 * Stop auto-refresh timer
 */
export const stopTokenRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    logInfo('⏸️ Token auto-refresh stopped');
  }
};

/**
 * Manually refresh access token using httpOnly cookie
 * No refresh token parameter needed - it's automatically sent in httpOnly cookie
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    logInfo('🔄 Refreshing access token using httpOnly cookie...');
    const response = await authApi.refreshToken();

    // Update access token in memory only (NOT localStorage for better security)
    const newAccessToken = response.token;
    setAuthToken(newAccessToken);

    // Store token temporarily in localStorage for bootstrap on page reload
    // This is less secure than pure memory storage but needed for SPA navigation
    // Note: Refresh token stays in httpOnly cookie (inaccessible to JavaScript)
    secureLocalStorage.set('token', newAccessToken);
    localStorage.setItem('token', newAccessToken);

    logInfo('✅ Access token refreshed successfully');
    return true;
  } catch (error) {
    logError('❌ Failed to refresh access token:', error);

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
    logError('Failed to parse token:', error);
    return true; // Refresh to be safe
  }
};
