/**
 * Optimized Authentication Hook
 * 
 * Performance improvements:
 * - Memoized auth state to prevent unnecessary re-renders
 * - Debounced token validation
 * - Optimized effect dependencies
 * - Stable callback references
 */

import { useState, useCallback, useMemo } from 'react';
import { useStableCallback, useDebouncedEffect, useEffectOnce } from './useOptimizedEffect';
import type { User, AuthResponse } from '../context/authTypes';
import { apiClient } from '../services/apiClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseOptimizedAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  fetchProfile: () => Promise<boolean>;
  clearError: () => void;
}

export const useOptimizedAuth = (): UseOptimizedAuthReturn => {
  // Centralized state management
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Memoized auth state properties
  const { user, isAuthenticated, isLoading, error } = authState;

  // Stable callback for state updates
  const updateAuthState = useStableCallback((updates: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  });

  // Token validation with debouncing
  const validateToken = useStableCallback(async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      updateAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      return;
    }

    try {
      // Parse stored user data
      const userData = JSON.parse(userStr);
      
      // Basic token validation (you can enhance this)
      const payload = parseJWT(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        updateAuthState({
          user: userData,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        // Token expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        updateAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      updateAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication validation failed'
      });
    }
  });

  // Initialize auth state on mount
  useEffectOnce(() => {
    validateToken();
  });

  // Debounced token validation on storage changes
  useDebouncedEffect(() => {
    const handleStorageChange = () => {
      validateToken();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [], 100);

  // Login function with optimized error handling
  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    updateAuthState({ isLoading: true, error: null });

    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', {
        email,
        password
      });

      if (response.success && response.user && response.token) {
        // Store auth data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Update auth state
        updateAuthState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        updateAuthState({
          isLoading: false,
          error: response.message || 'Login failed'
        });
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      updateAuthState({
        isLoading: false,
        error: errorMessage
      });
      
      return {
        success: false,
        message: errorMessage,
        user: null,
        token: null
      };
    }
  }, [updateAuthState]);

  // Logout function
  const logout = useStableCallback(() => {
    // Clear storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminAuthed');
    
    // Update state
    updateAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });

    // Clear API client cache
    apiClient.clearCache();
  });

  // Update profile function
  const updateProfile = useCallback(async (profileData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    updateAuthState({ isLoading: true, error: null });

    try {
      const updatedUser = await apiClient.put<User>(`/api/users/${user.id}`, profileData);
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state
      updateAuthState({
        user: updatedUser,
        isLoading: false,
        error: null
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      updateAuthState({
        isLoading: false,
        error: errorMessage
      });
      
      return false;
    }
  }, [user, updateAuthState]);

  // Fetch profile function
  const fetchProfile = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    updateAuthState({ isLoading: true, error: null });

    try {
      const profileData = await apiClient.get<User>(`/api/users/${user.id}`, {
        cache: true // Cache profile data
      });
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(profileData));
      
      // Update state
      updateAuthState({
        user: profileData,
        isLoading: false,
        error: null
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile';
      updateAuthState({
        isLoading: false,
        error: errorMessage
      });
      
      return false;
    }
  }, [user, updateAuthState]);

  // Clear error function
  const clearError = useStableCallback(() => {
    updateAuthState({ error: null });
  });

  // Memoized return value to prevent unnecessary re-renders
  return useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateProfile,
    fetchProfile,
    clearError
  }), [
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateProfile,
    fetchProfile,
    clearError
  ]);
};

// Helper function to parse JWT token
function parseJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT parsing error:', error);
    return null;
  }
}
