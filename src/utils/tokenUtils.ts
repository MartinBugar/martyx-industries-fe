/**
 * Utility functions for handling JWT tokens
 */

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
  console.log('=== JWT Token Debug ===');
  
  const rawToken = localStorage.getItem('token');
  const token = getAuthToken();
  
  console.log('Raw token from localStorage:', rawToken);
  console.log('Parsed token:', token);
  console.log('Token exists:', !!token);
  console.log('Token length:', token?.length);
  console.log('Token first 50 chars:', token?.substring(0, 50));
  
  if (token) {
    // Check if token has correct JWT format (3 parts separated by dots)
    const parts = token.split('.');
    console.log('Token parts count:', parts.length);
    console.log('Is valid JWT format:', parts.length === 3);
    
    // Try to decode header and payload (without verification)
    try {
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token header:', header);
      console.log('Token payload (user info):', payload);
      console.log('Token expiry:', new Date(payload.exp * 1000));
      console.log('Is token expired:', Date.now() >= payload.exp * 1000);
    } catch (e) {
      console.log('Failed to decode token:', e);
    }
  }
  
  console.log('Authorization header would be:', `Bearer ${token}`.substring(0, 60) + '...');
  console.log('========================');
};

/**
 * Clear all authentication tokens and user data
 * Useful for debugging JWT issues
 */
export const clearAuthData = (): void => {
  console.log('🧹 Clearing all authentication data...');
  
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
  
  console.log('✅ All authentication data cleared');
  console.log('👉 Please logout and login again to get a fresh token');
};
