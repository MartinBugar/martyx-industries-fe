import { logError, logInfo } from './logger';
// Import common API utilities
import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders, updateAuthorizationHeader } from './apiUtils';
// Import secure token manager
import { setAccessToken, clearAuthData } from '../utils/tokenManager';
// Import device fingerprint for security
import { getDeviceFingerprint } from '../utils/deviceFingerprint';
import type {
  AuthResponse,
  ResetPasswordResponse
} from '../context/authTypes';

// Custom error class for account lockout
export class AccountLockedError extends Error {
  code: string;
  accountLocked: boolean;
  lockedUntil: string | null;
  remainingSeconds: number | null;

  constructor(message: string, lockedUntil: string | null, remainingSeconds: number | null) {
    super(message);
    this.name = 'AccountLockedError';
    this.code = 'ACCOUNT_LOCKED';
    this.accountLocked = true;
    this.lockedUntil = lockedUntil;
    this.remainingSeconds = remainingSeconds;
  }
}

// Authentication API endpoints
export const authApi = {
  // Login endpoint - handles account lockout (423 status) specially
  // SECURITY: Sends device fingerprint for token theft detection
  login: async (email: string, password: string): Promise<AuthResponse> => {
    // Get device fingerprint for security
    const fingerprint = await getDeviceFingerprint();

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, withLangHeaders({
      method: 'POST',
      headers: {
        ...defaultHeaders,
        'X-Device-Fingerprint': fingerprint,  // SECURITY: For token theft detection
      } as HeadersInit,
      body: JSON.stringify({ email, password }),
    }));

    // Handle 423 Locked status - account is locked
    if (response.status === 423) {
      const errorData = await response.json();
      logInfo('Account locked response:', errorData);
      throw new AccountLockedError(
        errorData.message || 'Účet je zablokovaný',
        errorData.lockedUntil || null,
        errorData.remainingSeconds || null
      );
    }

    // Handle other error statuses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Neznáma chyba' }));
      const error = new Error(errorData.message || 'Prihlásenie zlyhalo') as Error & { errorData?: unknown };
      error.errorData = errorData;
      logError('Login API error:', errorData);
      throw error;
    }

    return await response.json() as AuthResponse;
  },
  
  // Logout endpoint - clears httpOnly refresh token cookie
  // NOTE: This endpoint must work even with expired/invalid token
  // We intentionally don't send Authorization header - logout should always succeed
  logout: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, withLangHeaders({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header - logout must work without valid token
        } as HeadersInit,
      }));

      // Don't use handleResponse - we don't want 401 handling for logout
      // Backend always returns 200 for logout (even if token was invalid)
      if (!response.ok) {
        logError('Logout returned non-OK status:', response.status);
      }
      return null;
    } catch (error) {
      // Logout errors are not critical - local cleanup will happen anyway
      logError('Logout API error (non-critical):', error);
      // Don't throw - logout should always "succeed" from caller's perspective
      return null;
    }
  },

  // Request password reset (forgot password)
  forgotPassword: async (email: string): Promise<ResetPasswordResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, withLangHeaders({
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
        body: JSON.stringify({ email }),
      }));
      
      return await handleResponse(response) as ResetPasswordResponse;
    } catch (error) {
      logError('Forgot password API error:', error);
      throw error;
    }
  },
  
  // Reset password with token
  resetPassword: async (token: string, password: string): Promise<ResetPasswordResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, withLangHeaders({
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
        body: JSON.stringify({ token, password }),
      }));

      return await handleResponse(response) as ResetPasswordResponse;
    } catch (error) {
      logError('Reset password API error:', error);
      throw error;
    }
  },

  // Refresh access token using httpOnly cookie (no parameter needed)
  // SECURITY: Sends device fingerprint for token theft detection
  refreshToken: async (): Promise<AuthResponse> => {
    try {
      // Get device fingerprint for security validation
      const fingerprint = await getDeviceFingerprint();

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, withLangHeaders({
        method: 'POST',
        headers: {
          ...defaultHeaders,
          'X-Device-Fingerprint': fingerprint,  // SECURITY: For token theft detection
        } as HeadersInit,
        // No body needed - refresh token is in httpOnly cookie
      }));

      return await handleResponse(response) as AuthResponse;
    } catch (error) {
      logError('Refresh token API error:', error);
      throw error;
    }
  },
};

/**
 * Set auth token for API requests
 * SECURITY: Token is stored in memory only (via tokenManager)
 * and also set in Authorization header for immediate use
 */
export const setAuthToken = (token: string) => {
  // Store in memory (secure)
  setAccessToken(token);
  // Set header for API requests
  updateAuthorizationHeader(token);
};

/**
 * Remove auth token from API requests
 * Clears both memory storage and Authorization header
 */
export const removeAuthToken = () => {
  // Clear from memory
  clearAuthData();
  // Clear header
  updateAuthorizationHeader(null);
};