import { logInfo, logWarn, logError } from './logger';
// API utilities
import i18n from '../i18n';
import { getCSRFToken, initializeCSRFToken } from '../utils/csrf';

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
    logError('Error decoding JWT token:', error);
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

    // Handle 429 Too Many Requests (Rate Limit Exceeded)
    if (response.status === 429) {
      const retryAfter = response.headers.get('X-Rate-Limit-Retry-After-Seconds') ||
                        response.headers.get('Retry-After') ||
                        '60';

      const rateLimitError = {
        message: errorData.message || 'Too many requests. Please try again later.',
        retryAfterSeconds: parseInt(retryAfter, 10),
        endpoint: new URL(response.url).pathname
      };

      logWarn('Rate limit exceeded:', rateLimitError);

      // Dispatch rate limit event for global handling
      window.dispatchEvent(new CustomEvent('api:rateLimit', {
        detail: rateLimitError
      }));

      // Throw specific rate limit error
      interface ErrorWithMetadata extends Error {
        errorData?: typeof errorData;
        rateLimitInfo?: typeof rateLimitError;
      }
      const error = new Error('RATE_LIMIT_EXCEEDED') as ErrorWithMetadata;
      error.errorData = errorData;
      error.rateLimitInfo = rateLimitError;
      throw error;
    }

    // Handle 401 Unauthorized responses (expired/invalid tokens)
    if (response.status === 401) {
      // Don't auto-logout for GDPR consent status endpoint
      // This endpoint is called on Settings page load and shouldn't trigger logout
      const isGdprConsentStatus = response.url.includes('/api/gdpr/consent/status');

      if (!isGdprConsentStatus) {
        logInfo('Received 401 Unauthorized, clearing authentication data');
        // Clear expired token and user data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('adminAuthed');
        // Remove authorization header using centralized function
        updateAuthorizationHeader(null);
        // Dispatch logout event with api_error reason to distinguish from token expiration
        window.dispatchEvent(new CustomEvent('auth:logout', {
          detail: { reason: 'api_error' }
        }));
      } else {
        logWarn('GDPR consent status request returned 401 - token may be invalid or expired');
      }
    }

    // Throw error with unified contract data
    interface ErrorWithData extends Error {
      errorData?: typeof errorData;
    }
    const error = new Error(errorData.errorCode || 'Unknown error') as ErrorWithData;
    error.errorData = errorData;
    throw error;
  }

  // Parse successful response
  // Don't try to parse empty responses (204 No Content or empty body)
  if (response.status === 204) {
    return null;
  }

  // Check if response has content
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');

  // If no content or content-length is 0, return null
  if (contentLength === '0' || !contentType) {
    return null;
  }

  // Only parse JSON if content-type indicates JSON
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    return data;
  }

  // For other content types, return null (we don't handle them)
  return null;
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
 * Add language headers to fetch init options and enable credentials for cookies
 * Also adds CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
 */
export const withLangHeaders = (init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers);
  const formattedLang = formatLanguageForBackend(getCurrentLanguage());

  headers.set('Accept-Language', formattedLang);

  // Add CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
  const method = (init?.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  if (import.meta.env.VITE_DEBUG_I18N) {
    logInfo(`🌐 withLangHeaders: language="${formattedLang}"`);
  }

  return {
    ...init,
    headers,
    credentials: 'include',  // CRITICAL: Required for httpOnly cookie authentication
  };
};

// Default headers for API requests
export const defaultHeaders: ApiHeaders = {
  'Content-Type': 'application/json',
};

// Accept-Language header is handled dynamically by withLangHeaders()

// Helper function to update Authorization header
export const updateAuthorizationHeader = (token: string | null) => {
  if (token && typeof token === 'string') {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  } else {
    delete defaultHeaders['Authorization'];
  }
};

// Bootstrap Authorization header from stored token on module load to survive refreshes
try {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('token');

    if (token && typeof token === 'string' && token.length > 0) {
      const payload = decodeJWT(token);
      const now = Math.floor(Date.now() / 1000);

      if (payload && typeof payload.exp === 'number' && payload.exp > now) {
        // Token valid: set Authorization header for immediate API calls
        updateAuthorizationHeader(token);
      } else {
        // Expired/invalid token: cleanup
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        window.localStorage.removeItem('adminAuthed');
      }
    }
  }
} catch (e) {
  logWarn('Auth bootstrap failed:', e);
}