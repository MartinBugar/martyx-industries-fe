// Token utility functions for JWT handling

// Get authentication token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // Handle both stringified and raw token
    return token.startsWith('"') ? JSON.parse(token) : token;
  } catch {
    return null;
  }
};

// Debug token information (for troubleshooting)
export const debugToken = (): void => {
  const token = getAuthToken();

  if (!token) {
    console.log('❌ No authentication token found');
    return;
  }

  console.log('🔑 Token preview:', token.substring(0, 20) + '...');

  try {
    // Decode JWT payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('⚠️ Invalid JWT format');
      return;
    }

    const payload = JSON.parse(atob(parts[1]));
    console.log('📦 Token payload:', {
      sub: payload.sub,
      exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
      iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'N/A',
      roles: payload.roles || payload.authorities || 'N/A'
    });

    // Check expiration
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < now;
      console.log(`⏰ Token ${isExpired ? 'EXPIRED' : 'VALID'}`);
    }
  } catch (error) {
    console.error('❌ Error decoding token:', error);
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
};

// Store auth token in localStorage
export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('token', token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('token');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};
