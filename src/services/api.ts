// Import common API utilities
import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

// Authentication API endpoints
export const authApi = {
  // Login endpoint
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
        body: JSON.stringify({ email, password }),
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  // Logout endpoint (if needed)
  logout: async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          'Authorization': `Bearer ${token}`,
        } as HeadersInit,
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Logout API error:', error);
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