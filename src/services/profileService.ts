// Profile service
import { handleResponse, API_BASE_URL, defaultHeaders, withLangHeaders } from './apiUtils';
import type { User } from '../context/authTypes';

// Type for profile update data
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

// Profile service
export const profileService = {
  // Fetch user profile data
  fetchProfile: async (userId: string): Promise<Partial<User>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Fetch profile API error:', error);
      throw error;
    }
  },
  
  // Update user profile data
  updateProfile: async (userId: string, profileData: ProfileUpdateData): Promise<Partial<User>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, withLangHeaders({
        method: 'PUT',
        headers: defaultHeaders as HeadersInit,
        body: JSON.stringify(profileData),
      }));
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Update profile API error:', error);
      throw error;
    }
  },
};