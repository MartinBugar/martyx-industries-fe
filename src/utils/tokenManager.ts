/**
 * Secure Token Manager
 *
 * SECURITY: Stores access token in memory only (not localStorage)
 * This prevents XSS attacks from stealing the token.
 *
 * Trade-offs:
 * - Token is lost on page refresh (requires /refresh call)
 * - More secure against XSS
 * - Slightly slower initial load (needs refresh call)
 *
 * How it works:
 * 1. On login: Token stored in memory only
 * 2. On page refresh: Call /refresh endpoint (httpOnly cookie has refresh token)
 * 3. On API calls: Read token from memory
 */

import { logInfo, logWarn } from '../services/logger';

// In-memory storage for access token
let accessToken: string | null = null;

// Subscribers for token changes (for React hooks)
type TokenChangeCallback = (token: string | null) => void;
const subscribers: Set<TokenChangeCallback> = new Set();

/**
 * Set access token in memory
 * @param token JWT access token or null to clear
 */
export const setAccessToken = (token: string | null): void => {
  accessToken = token;

  // Notify all subscribers
  subscribers.forEach(callback => {
    try {
      callback(token);
    } catch (e) {
      logWarn('Token subscriber error:', e);
    }
  });

  if (token) {
    logInfo('🔐 Access token stored in memory');
  } else {
    logInfo('🔓 Access token cleared from memory');
  }
};

/**
 * Get access token from memory
 * @returns JWT access token or null
 */
export const getAccessToken = (): string | null => {
  return accessToken;
};

/**
 * Check if access token exists
 */
export const hasAccessToken = (): boolean => {
  return accessToken !== null;
};

/**
 * Subscribe to token changes
 * @param callback Function called when token changes
 * @returns Unsubscribe function
 */
export const subscribeToTokenChanges = (callback: TokenChangeCallback): (() => void) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

/**
 * Clear all auth data (for logout)
 */
export const clearAuthData = (): void => {
  accessToken = null;

  // Also clear localStorage fallback data
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminAuthed');
  } catch (e) {
    logWarn('Failed to clear localStorage:', e);
  }

  // Notify subscribers
  subscribers.forEach(callback => {
    try {
      callback(null);
    } catch (e) {
      logWarn('Token subscriber error during clear:', e);
    }
  });

  logInfo('🧹 All auth data cleared');
};

/**
 * Bootstrap token from localStorage on initial load
 * This is a fallback for backwards compatibility during migration
 *
 * MIGRATION: This can be removed after all users have migrated to memory-only storage
 */
export const bootstrapFromLocalStorage = (): boolean => {
  try {
    const storedToken = localStorage.getItem('token');
    if (storedToken && typeof storedToken === 'string' && storedToken.length > 0) {
      // Validate token structure (basic check)
      const parts = storedToken.split('.');
      if (parts.length === 3) {
        // Check expiration
        try {
          const payload = JSON.parse(atob(parts[1]));
          const now = Math.floor(Date.now() / 1000);

          if (payload.exp && payload.exp > now) {
            // Token is valid, bootstrap it to memory
            accessToken = storedToken;
            logInfo('🔄 Bootstrapped valid token from localStorage to memory');

            // Clear from localStorage (migration to memory-only)
            // Commented out for now - enable after testing
            // localStorage.removeItem('token');

            return true;
          } else {
            // Token expired, clear it
            localStorage.removeItem('token');
            logInfo('🧹 Cleared expired token from localStorage');
          }
        } catch (e) {
          // Invalid token payload
          localStorage.removeItem('token');
          logWarn('🧹 Cleared invalid token from localStorage');
        }
      }
    }
  } catch (e) {
    logWarn('Failed to bootstrap from localStorage:', e);
  }

  return false;
};
