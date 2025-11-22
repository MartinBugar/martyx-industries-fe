/**
 * Utility functions for handling JWT tokens
 */

import { logInfo } from '../services/logger';

/**
 * Get JWT token from localStorage, handling both JSON and plain string formats
 * @returns The JWT token as a string, or null if not found
 */
export const getAuthToken = (): string | null => {
  let token = localStorage.getItem('token');
  
  if (!token) {
    return null;
  }
  
  // Parse token if it's stored as JSON string
  try {
    const parsed = JSON.parse(token);
    if (typeof parsed === 'string') {
      token = parsed;
    }
  } catch {
    // Token is already a plain string, use as is
  }
  
  return token;
};

/**
 * Debug JWT token information
 * Logs token details to console for debugging purposes
 */
export const debugToken = (): void => {
  logInfo('=== JWT Token Debug ===');
  
  const rawToken = localStorage.getItem('token');
  const token = getAuthToken();
  
  logInfo('Raw token from localStorage:', rawToken);
  logInfo('Parsed token:', token);
  logInfo('Token exists:', !!token);
  logInfo('Token length:', token?.length);
  logInfo('Token first 50 chars:', token?.substring(0, 50));
  
  if (token) {
    // Check if token has correct JWT format (3 parts separated by dots)
    const parts = token.split('.');
    logInfo('Token parts count:', parts.length);
    logInfo('Is valid JWT format:', parts.length === 3);
    
    // Try to decode header and payload (without verification)
    try {
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      logInfo('Token header:', header);
      logInfo('Token payload (user info):', payload);
      logInfo('Token expiry:', new Date(payload.exp * 1000));
      logInfo('Is token expired:', Date.now() >= payload.exp * 1000);
    } catch (e) {
      logInfo('Failed to decode token:', e);
    }
  }
  
  logInfo('Authorization header would be:', `Bearer ${token}`.substring(0, 60) + '...');
  logInfo('========================');
};

/**
 * Clear all authentication tokens and user data
 * Useful for debugging JWT issues
 */
export const clearAuthData = (): void => {
  logInfo('🧹 Clearing all authentication data...');
  
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('jwt');
  
  // Clear sessionStorage
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('jwt');
  
  logInfo('✅ All authentication data cleared');
  logInfo('👉 Please logout and login again to get a fresh token');
};
