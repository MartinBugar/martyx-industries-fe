// API utilities

// Define the type for headers
export interface ApiHeaders {
  'Content-Type': string;
  'Authorization'?: string;
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

// Helper function to handle API responses
export const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // Handle 401 Unauthorized responses (expired/invalid tokens)
    if (response.status === 401) {
      console.log('Received 401 Unauthorized, clearing authentication data');
      // Clear expired token and user data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Remove authorization header
      delete defaultHeaders['Authorization'];
      // Dispatch logout event with api_error reason to distinguish from token expiration
      window.dispatchEvent(new CustomEvent('auth:logout', { 
        detail: { reason: 'api_error' } 
      }));
    }
    
    // If the server response was not ok, throw an error with the response data
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

// API base URL - shared across services
export const API_BASE_URL = 'http://localhost:8080';

// Default headers for API requests
export const defaultHeaders: ApiHeaders = {
  'Content-Type': 'application/json',
};