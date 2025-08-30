// Import common API utilities
import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import type {
  AuthResponse,
  ResetPasswordResponse
} from '../context/authTypes';

// Authentication API endpoints
export const authApi = {
  // Login endpoint
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, withLangHeaders({
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
        body: JSON.stringify({ email, password }),
      }));
      
      return await handleResponse(response) as AuthResponse;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  // Logout endpoint (if needed)
  logout: async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, withLangHeaders({
        method: 'POST',
        headers: {
          ...defaultHeaders,
          'Authorization': `Bearer ${token}`,
        } as HeadersInit,
      }));
      
      return handleResponse(response);
    } catch (error) {
      console.error('Logout API error:', error);
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
      console.error('Forgot password API error:', error);
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