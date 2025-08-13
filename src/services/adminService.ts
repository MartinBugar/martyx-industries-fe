import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

export const adminService = {
  // Verifies if the current authenticated user has ADMIN privileges on the backend
  checkAdmin: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/check`, {
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      });

      if (response.ok) {
        return true; // User is admin
      }

      if (response.status === 401) {
        // Use common handler to clear auth and dispatch logout event
        try { await handleResponse(response); } catch { /* ignore thrown error */ }
        return false;
      }

      if (response.status === 403) {
        // Authenticated but forbidden: not an admin
        return false;
      }

      // Other errors
      return false;
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  }
};
