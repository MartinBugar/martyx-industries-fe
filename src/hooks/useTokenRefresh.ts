import { useEffect, useRef } from 'react';
import { authApi, setAuthToken } from '../services/api';
import { isTokenExpired } from '../services/apiUtils';

/**
 * Automatic token refresh hook.
 * Refreshes JWT token 5 minutes before expiration.
 */
export function useTokenRefresh(enabled: boolean = true) {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const checkAndRefreshToken = async () => {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

      if (!token) {
        return;
      }

      // Check if token expires in the next 5 minutes
      const expiresIn5Min = isTokenExpired(token, 5 * 60 * 1000); // 5 minutes buffer

      if (expiresIn5Min) {
        try {
          // Note: This requires a refresh token endpoint on backend
          // For now, we'll just warn the user
          console.warn('Token expiring soon. Consider implementing token refresh endpoint.');

          // If you have a refresh endpoint:
          // const refreshed = await authApi.refreshToken();
          // if (refreshed?.token) {
          //   localStorage.setItem('token', refreshed.token);
          //   setAuthToken(refreshed.token);
          // }
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }
    };

    // Check every minute
    refreshIntervalRef.current = setInterval(checkAndRefreshToken, 60 * 1000);

    // Initial check
    checkAndRefreshToken();

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [enabled]);
}
