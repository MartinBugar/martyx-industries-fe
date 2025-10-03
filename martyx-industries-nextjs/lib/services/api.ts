// API utilities and authentication endpoints for Next.js
import { getApiBaseUrl } from '../api';

// Define the type for headers
export interface ApiHeaders {
  'Content-Type': string;
  'Authorization'?: string;
  'Accept-Language'?: string;
  [key: string]: string | undefined;
}

// Default headers for API requests
export const defaultHeaders: ApiHeaders = {
  'Content-Type': 'application/json',
};

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
        status: response.status,
        error: response.statusText,
        message: `HTTP ${response.status}: ${response.statusText}`,
        path: response.url
      };
    }
    
    const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`) as Error & { status: number; data: unknown };
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  
  return response;
};

// Helper function to add language headers
export const withLangHeaders = (options: RequestInit): RequestInit => {
  const headers = new Headers(options.headers);
  
  // Add Accept-Language header if not already present
  if (!headers.has('Accept-Language')) {
    // In Next.js, we might get language from different sources
    const language = typeof window !== 'undefined' 
      ? localStorage.getItem('i18nextLng') || 'en'
      : 'en';
    headers.set('Accept-Language', language);
  }
  
  return {
    ...options,
    headers
  };
};

// Authentication API endpoints
export const authApi = {
  // Login endpoint
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, withLangHeaders({
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
        body: JSON.stringify({ email, password }),
      }));
      
      const handledResponse = await handleResponse(response);
      return await handledResponse.json();
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  // Logout endpoint
  logout: async (token: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/logout`, withLangHeaders({
        method: 'POST',
        headers: {
          ...defaultHeaders,
          'Authorization': `Bearer ${token}`,
        } as HeadersInit,
      }));
      
      const handledResponse = await handleResponse(response);
      return await handledResponse.json();
    } catch (error) {
      console.error('Logout API error:', error);
      throw error;
    }
  },

  // Request password reset (forgot password)
  forgotPassword: async (email: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/forgot-password`, withLangHeaders({
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
        body: JSON.stringify({ email }),
      }));
      
      const handledResponse = await handleResponse(response);
      return await handledResponse.json();
    } catch (error) {
      console.error('Forgot password API error:', error);
      throw error;
    }
  },
  
  // Reset password with token
  resetPassword: async (token: string, password: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/reset-password`, withLangHeaders({
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
        body: JSON.stringify({ token, password }),
      }));
      
      const handledResponse = await handleResponse(response);
      return await handledResponse.json();
    } catch (error) {
      console.error('Reset password API error:', error);
      throw error;
    }
  },
};

// Function to add auth token to requests
export const setAuthToken = (token: string) => {
  defaultHeaders['Authorization'] = `Bearer ${token}`;
};

// Function to remove auth token from requests
export const removeAuthToken = () => {
  delete defaultHeaders['Authorization'];
};

// Generic API client functions
export const apiClient = {
  get: async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
      ...options,
    }));
    
    const handledResponse = await handleResponse(response);
    return await handledResponse.json();
  },

  post: async (endpoint: string, data: unknown, options: RequestInit = {}) => {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(data),
      ...options,
    }));
    
    const handledResponse = await handleResponse(response);
    return await handledResponse.json();
  },

  put: async (endpoint: string, data: unknown, options: RequestInit = {}) => {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, withLangHeaders({
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(data),
      ...options,
    }));
    
    const handledResponse = await handleResponse(response);
    return await handledResponse.json();
  },

  delete: async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, withLangHeaders({
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
      ...options,
    }));
    
    const handledResponse = await handleResponse(response);
    return await handledResponse.json();
  },
};
