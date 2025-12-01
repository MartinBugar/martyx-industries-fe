import { logError, logInfo } from './logger';
// Import common API utilities
import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders, updateAuthorizationHeader } from './apiUtils';
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
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
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
  logout: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, withLangHeaders({
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
      }));

      return handleResponse(response);
    } catch (error) {
      logError('Logout API error:', error);
      throw error;
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
  refreshToken: async (): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, withLangHeaders({
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
        // No body needed - refresh token is in httpOnly cookie
      }));

      return await handleResponse(response) as AuthResponse;
    } catch (error) {
      logError('Refresh token API error:', error);
      throw error;
    }
  },
};

// Function to add auth token to requests
export const setAuthToken = (token: string) => {
  updateAuthorizationHeader(token);
};

// Function to remove auth token from requests
export const removeAuthToken = () => {
  updateAuthorizationHeader(null);
};