'use client';

import React, { useState, type ReactNode, useEffect } from 'react';
import { AuthContext, type User, type Order, type LoginErrorResponse } from './AuthContext';
import { authApi, setAuthToken, removeAuthToken } from '../lib/services/api';
import { isTokenExpired } from '../lib/services/api';

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// Utility functions for secure storage
const secureLocalStorage = {
  get: (key: string, defaultValue: any = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }
};

// isTokenExpired is now imported from lib/services/api

// AuthProvider component to wrap the app and provide authentication functionality
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [hasLoadedOrders, setHasLoadedOrders] = useState<boolean>(false);
  
  // Check if user and token are stored in localStorage on initial load
  useEffect(() => {
    const init = async () => {
      console.log('🔄 AuthProvider init started');
      
      // Try both secureLocalStorage and regular localStorage for compatibility
      let storedUser = secureLocalStorage.get('user', null);
      let token: string | null = secureLocalStorage.get('token', null);
      
      // Fallback to regular localStorage if secureLocalStorage is empty
      if (!token) {
        const tokenRaw = localStorage.getItem('token');
        if (tokenRaw) {
          try {
            const parsed = JSON.parse(tokenRaw);
            token = typeof parsed === 'string' ? parsed : null;
          } catch {
            token = tokenRaw;
          }
        }
      }
      
      if (!storedUser) {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          try {
            storedUser = JSON.parse(userRaw);
          } catch {
            storedUser = null;
          }
        }
      }
      
      console.log('📦 Stored data:', { hasUser: !!storedUser, hasToken: !!token, tokenType: typeof token });
      
      // Check if token exists and is valid
      if (token && typeof token === 'string') {
        // Check if token is expired
        if (isTokenExpired(token)) {
          console.log('❌ Token has expired, logging out user');
          // Clear expired token and user data
          secureLocalStorage.remove('user');
          secureLocalStorage.remove('token');
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          removeAuthToken();
          setUser(null);
        } else {
          console.log('✅ Token is valid, setting auth');
          
          // Set token for API requests
          setAuthToken(token);
          
          // If user exists, set it in state
          if (storedUser && typeof storedUser === 'object') {
            try {
              console.log('👤 Setting user from stored data');
              setUser(storedUser as User);
            } catch (error) {
              console.error('❌ Failed to parse stored user:', error);
              secureLocalStorage.remove('user');
              secureLocalStorage.remove('token');
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              removeAuthToken();
            }
          } else {
            console.log('⚠️ No stored user found');
          }
        }
      } else {
        console.log('🚫 No valid token found');
      }
      
      // Set loading to false after attempting to restore authentication state
      setIsLoading(false);
      console.log('✅ AuthProvider init completed');
    };

    init();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean | LoginErrorResponse> => {
    setIsLoading(true);

    try {
      console.log('🔑 Attempting login for:', email);

      // Call actual API - returns { token, id, email, emailConfirmed }
      const response = await authApi.login(email, password);

      console.log('📦 Login response:', response);

      // Extract data from response
      const { token, id, email: userEmail, emailConfirmed } = response;

      // Check if email is confirmed
      if (emailConfirmed === false) {
        console.log('⚠️ Email not confirmed');
        return {
          success: false,
          message: 'Please confirm your email address before logging in. Check your email for the confirmation link.',
          code: 'EMAIL_NOT_CONFIRMED'
        };
      }

      // Check if we have required data
      if (!token || !id || !userEmail) {
        console.error('❌ Missing required login data:', { hasToken: !!token, hasId: !!id, hasEmail: !!userEmail });
        return {
          success: false,
          message: 'Login response missing required data',
          code: 'INVALID_RESPONSE'
        };
      }

      // Create user object from response data
      const newUser: User = {
        id: id,
        email: userEmail,
        orders: [] // Initialize empty orders array
      };

      // Store user data in state and localStorage
      setUser(newUser);
      console.log('💾 Storing user:', newUser);
      secureLocalStorage.set('user', newUser);
      localStorage.setItem('user', JSON.stringify(newUser)); // Also store in regular localStorage

      // Store token in localStorage
      console.log('🔑 Storing token');
      secureLocalStorage.set('token', token);
      localStorage.setItem('token', JSON.stringify(token)); // Also store in regular localStorage

      // Set auth token for future API requests
      setAuthToken(token);

      console.log('✅ Login successful');

      return true;
    } catch (error: any) {
      console.error('❌ Login failed:', error);

      // Check if the error message contains text about account not being activated
      const errorMessage = error.data?.message || error.message || String(error);
      if (errorMessage.includes('Account not activated') ||
          errorMessage.includes('not activated') ||
          errorMessage.toLowerCase().includes('confirm your registration')) {
        return {
          success: false,
          message: 'Account not activated. Please check your email and confirm your registration.',
          code: 'EMAIL_NOT_CONFIRMED'
        };
      }

      return {
        success: false,
        message: error.data?.message || error.message || 'Login failed. Please check your credentials.',
        code: error.data?.code || 'LOGIN_FAILED'
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    console.log('🚪 Logging out user');
    
    // Get current token for API call
    const token = secureLocalStorage.get('token', null);
    
    // Call logout API if token exists
    if (token) {
      try {
        await authApi.logout(token);
      } catch (error) {
        console.warn('Logout API call failed:', error);
        // Continue with local logout even if API fails
      }
    }
    
    // Clear stored data
    secureLocalStorage.remove('user');
    secureLocalStorage.remove('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Remove auth token from future requests
    removeAuthToken();
    
    // Clear state
    setUser(null);
    setHasLoadedOrders(false);
    
    console.log('✅ Logout completed');
  };

  // Update profile function
  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      console.log('📝 Updating profile:', profileData);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...user, ...profileData };
      
      // Update stored user
      secureLocalStorage.set('user', updatedUser);
      setUser(updatedUser);
      
      console.log('✅ Profile updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      return false;
    }
  };

  // Fetch profile function
  const fetchProfile = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      console.log('📥 Fetching profile for user:', user.id);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In real implementation, fetch from API and update user
      console.log('✅ Profile fetched successfully');
      return true;
    } catch (error) {
      console.error('❌ Profile fetch failed:', error);
      return false;
    }
  };

  // Add order function
  const addOrder = (order: Omit<Order, 'id' | 'date'>): void => {
    if (!user) return;
    
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    
    const updatedUser = {
      ...user,
      orders: [newOrder, ...user.orders]
    };
    
    secureLocalStorage.set('user', updatedUser);
    setUser(updatedUser);
    
    console.log('✅ Order added:', newOrder.id);
  };

  // Get orders function
  const getOrders = (): Order[] => {
    return user?.orders || [];
  };

  // Refresh orders function
  const refreshOrders = async (): Promise<boolean> => {
    if (!user) return false;
    
    setOrdersLoading(true);
    
    try {
      console.log('🔄 Refreshing orders for user:', user.id);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, fetch orders from API
      setHasLoadedOrders(true);
      console.log('✅ Orders refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Orders refresh failed:', error);
      return false;
    } finally {
      setOrdersLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('📧 Sending password reset email to:', email);
      
      const response = await authApi.forgotPassword(email);
      
      return {
        success: response.success !== false,
        message: response.message || 'Password reset email sent successfully. Please check your inbox.'
      };
    } catch (error: any) {
      console.error('❌ Forgot password failed:', error);
      return {
        success: false,
        message: error.data?.message || error.message || 'Failed to send password reset email. Please try again.'
      };
    }
  };

  // Reset password function
  const resetPassword = async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🔑 Resetting password with token:', token.substring(0, 10) + '...');
      
      const response = await authApi.resetPassword(token, password);
      
      return {
        success: response.success !== false,
        message: response.message || 'Password reset successfully. You can now sign in with your new password.'
      };
    } catch (error: any) {
      console.error('❌ Password reset failed:', error);
      return {
        success: false,
        message: error.data?.message || error.message || 'Password reset failed. Please try again or request a new reset link.'
      };
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateProfile,
    fetchProfile,
    addOrder,
    getOrders,
    refreshOrders,
    ordersLoading,
    hasLoadedOrders,
    forgotPassword,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
