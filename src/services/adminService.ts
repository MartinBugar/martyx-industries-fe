import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import { authApi } from './api';

export const adminService = {
  // Verifies if the current authenticated user has ADMIN privileges on the backend
  // If credentials are provided, performs a temporary login with email/password to check admin access.
  checkAdmin: async (credentials?: { email: string; password: string }): Promise<boolean> => {
    // Preserve the current Authorization header to avoid side effects
    const previousAuth = defaultHeaders['Authorization'];
    const usingTempCredentials = !!(credentials?.email && credentials?.password);

    try {
      // If email/password provided, obtain a temporary token via login
      if (usingTempCredentials) {
        try {
          const loginResp = await authApi.login(credentials!.email, credentials!.password);
          if (!loginResp?.token) {
            return false;
          }
          // Temporarily set Authorization header with admin token (do not touch localStorage)
          defaultHeaders['Authorization'] = `Bearer ${loginResp.token}`;
        } catch {
          // Invalid credentials or login error
          return false;
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/check`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      if (response.ok) {
        // Backend now returns a boolean body: true if admin, false otherwise
        try {
          const data = await response.json();
          if (typeof data === 'boolean') return data;
          if (typeof data === 'string') return data.trim().toLowerCase() === 'true';
          if (data && typeof data.isAdmin === 'boolean') return data.isAdmin;
          return false;
        } catch {
          // If body can't be parsed, assume not admin
          return false;
        }
      }

      // When using existing session, a 401 should clear auth state (expired token)
      if (!usingTempCredentials && response.status === 401) {
        // Use common handler to clear auth and dispatch logout event
        try { await handleResponse(response); } catch { /* ignore thrown error */ }
        return false;
      }

      // For temporary credentials, 401/403 simply mean credentials lack admin access or are invalid
      if (response.status === 401 || response.status === 403) {
        // Not an admin or unauthorized
        return false;
      }

      // Other errors
      return false;
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    } finally {
      // Restore previous Authorization header to avoid altering global auth
      if (usingTempCredentials) {
        if (previousAuth) {
          defaultHeaders['Authorization'] = previousAuth;
        } else {
          delete defaultHeaders['Authorization'];
        }
      }
    }
  }
};
