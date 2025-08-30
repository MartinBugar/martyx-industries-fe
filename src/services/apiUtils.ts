// API utilities
import i18n from '../i18n';

// Define the type for headers
export interface ApiHeaders {
  'Content-Type': string;
  'Authorization'?: string;
  'Accept-Language'?: string;
  [key: string]: string | undefined;
}

// Helper function to decode JWT token payload
export const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

// Helper function to check if JWT token is expired
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true; // Consider invalid tokens as expired
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

// Helper function to handle API responses with unified error contract
export const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      // If JSON parsing fails, create a generic error
      errorData = {
        timestamp: new Date().toISOString(),
        path: response.url,
        errorCode: 'ERR_INTERNAL',
        args: {}
      };
    }
    
    // Handle 401 Unauthorized responses (expired/invalid tokens)
    if (response.status === 401) {
      console.log('Received 401 Unauthorized, clearing authentication data');
      // Clear expired token and user data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('adminAuthed');
      // Remove authorization header
      delete defaultHeaders['Authorization'];
      // Dispatch logout event with api_error reason to distinguish from token expiration
      window.dispatchEvent(new CustomEvent('auth:logout', { 
        detail: { reason: 'api_error' } 
      }));
    }
    
    // Throw error with unified contract data
    const error = new Error(errorData.errorCode || 'Unknown error');
    (error as any).errorData = errorData;
    throw error;
  }
  
  // Parse successful response
  const data = await response.json();
  return data;
};

// API base URL - shared across services
// Prefer VITE_API_BASE_URL if provided; otherwise use production default when building for prod,
// and localhost for development. Normalize to avoid trailing slashes.
const ENV_API_URL: string | undefined =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;

const computeApiBaseUrl = (): string => {
  const raw = (ENV_API_URL && ENV_API_URL.trim().length > 0)
    ? ENV_API_URL.trim()
    : ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD)
        ? 'https://martyx-industries-be-2xf3x.ondigitalocean.app'
        : 'http://localhost:8080');
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
};

export const API_BASE_URL = computeApiBaseUrl();

/**
 * Get current language from i18n with fallback
 */
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};

/**
 * Format language tag for Spring Boot Locale parsing
 */
const formatLanguageForBackend = (lang: string): string => {
  switch (lang) {
    case 'en':
    case 'english':
      return 'en';
    case 'sk':
    case 'slovak':
    case 'slovensky':
      return 'sk';
    case 'de':
    case 'german':
    case 'deutsch':
      return 'de';
    default:
      return lang.toLowerCase().split('-')[0];
  }
};

/**
 * Add language headers to fetch init options
 */
export const withLangHeaders = (init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers);
  const formattedLang = formatLanguageForBackend(getCurrentLanguage());
  
  headers.set('Accept-Language', formattedLang);
  
  if (import.meta.env.VITE_DEBUG_I18N) {
    console.log(`🌐 withLangHeaders: language="${formattedLang}"`);
  }
  
  return {
    ...init,
    headers,
  };
};

// Default headers for API requests
export const defaultHeaders: ApiHeaders = {
  'Content-Type': 'application/json',
};

// Accept-Language header is handled dynamically by withLangHeaders()

// Bootstrap Authorization header from stored token on module load to survive refreshes
try {
  if (typeof window !== 'undefined') {
    console.log('🚀 apiUtils bootstrap started');
    const tokenRaw = window.localStorage.getItem('token');
    console.log('📦 Raw token from localStorage:', tokenRaw);
    
    if (tokenRaw) {
      let token: string;
      try {
        // Parse token (stored as JSON string by secureLocalStorage)
        token = JSON.parse(tokenRaw);
        console.log('✅ Token parsed from JSON');
      } catch {
        // Fallback for plain string tokens
        token = tokenRaw;
        console.log('⚠️ Using raw token (not JSON)');
      }
      
      console.log('🔍 Final token type:', typeof token);
      
      if (typeof token === 'string') {
        const payload = decodeJWT(token);
        const now = Math.floor(Date.now() / 1000);
        console.log('🕒 Token check:', { hasPayload: !!payload, exp: payload?.exp, now });
        
        if (payload && typeof payload.exp === 'number' && payload.exp > now) {
          // Token valid: set Authorization header for immediate API calls
          console.log('✅ Token valid, setting Authorization header');
          defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else {
          // Expired/invalid token: cleanup
          console.log('❌ Token expired/invalid, cleaning up');
          window.localStorage.removeItem('token');
          window.localStorage.removeItem('user');
          window.localStorage.removeItem('adminAuthed');
        }
      } else {
        console.log('❌ Token is not a string');
      }
    } else {
      console.log('🚫 No token found in localStorage');
    }
  }
} catch (e) {
  console.warn('Auth bootstrap failed:', e);
}