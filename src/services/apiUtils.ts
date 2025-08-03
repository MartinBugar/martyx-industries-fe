// API utilities

// Define the type for headers
export interface ApiHeaders {
  'Content-Type': string;
  'Authorization'?: string;
  [key: string]: string | undefined;
}

// Helper function to handle API responses
export const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
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