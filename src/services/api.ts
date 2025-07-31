// API base URL
const API_BASE_URL = 'https://api.example.com'; // Replace with your actual API base URL

// Define the type for headers
interface ApiHeaders {
  'Content-Type': string;
  'Authorization'?: string;
  [key: string]: string | undefined;
}

// Default headers for API requests
const defaultHeaders: ApiHeaders = {
  'Content-Type': 'application/json',
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // If the server response was not ok, throw an error with the response data
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

// Authentication API endpoints
export const authApi = {
  // Login endpoint
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
  
  // Registration endpoint
  register: async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
        body: JSON.stringify({ name, email, password }),
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Registration API error:', error);
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