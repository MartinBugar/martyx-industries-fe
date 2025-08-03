// Registration service
import { handleResponse, API_BASE_URL, defaultHeaders } from './apiUtils';

// Registration service
export const registrationService = {
  // Register a new user
  register: async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
        body: JSON.stringify({ email, password }),
      });
      
      const data = await handleResponse(response);
      return !!data; // Return true if data exists, false otherwise
    } catch (error) {
      console.error('Registration API error:', error);
      throw error;
    }
  },
};