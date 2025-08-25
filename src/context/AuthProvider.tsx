import React, { useState, type ReactNode, useEffect } from 'react';
import type { User } from './authTypes';
import type { Order } from './authTypes';
import { AuthContext } from './AuthContext';
import { authApi, setAuthToken, removeAuthToken } from '../services/api';
import { profileService } from '../services/profileService';
import { isTokenExpired } from '../services/apiUtils';
import { ordersService } from '../services/ordersService';
import { secureLocalStorage, loginRateLimiter } from '../utils/security';

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component to wrap the app and provide authentication functionality
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // In a real application, you would store this in a more secure way
  // and validate against a backend server
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [hasLoadedOrders, setHasLoadedOrders] = useState<boolean>(false);
  
  // Check if user and token are stored in localStorage on initial load
  useEffect(() => {
    const init = async () => {
      const storedUser = secureLocalStorage.get('user', null);
      const token = secureLocalStorage.get('token', null);
      
      // Check if token exists and is valid
      if (token && typeof token === 'string') {
        // Check if token is expired
        if (isTokenExpired(token)) {
          console.log('Token has expired, logging out user');
          // Clear expired token and user data
          secureLocalStorage.remove('user');
          secureLocalStorage.remove('token');
          removeAuthToken();
          setUser(null);
        } else {
          // Token is valid, set it for API requests
          setAuthToken(token);
          
          // If user exists, set it in state
          if (storedUser && typeof storedUser === 'object') {
            try {
              setUser(storedUser as User);
            } catch (error) {
              console.error('Failed to parse stored user:', error);
              secureLocalStorage.remove('user');
              secureLocalStorage.remove('token');
              removeAuthToken();
            }
          }
          
          // Defer fetching orders until the user opens the Order History tab
        }
      }
      
      // Set loading to false after attempting to restore authentication state
      setIsLoading(false);
    };
    void init();
  }, []);

  // Listen for 401 logout events from API calls
  useEffect(() => {
    const handleAuthLogout = (event: CustomEvent) => {
      const reason = event.detail?.reason || 'unknown';
      console.log('Received auth:logout event, updating authentication state. Reason:', reason);
      setUser(null);
    };

    window.addEventListener('auth:logout', handleAuthLogout as EventListener);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout as EventListener);
    };
  }, []);

  // Login function - makes an API call to the backend
  const login = async (email: string, password: string): Promise<boolean | { error: string; type: string }> => {
    try {
      // Rate limiting check
      const identifier = email.toLowerCase();
      if (!loginRateLimiter.isAllowed(identifier)) {
        const remainingTime = Math.ceil(loginRateLimiter.getRemainingTime(identifier) / 60000);
        return {
          error: `Príliš veľa pokusov o prihlásenie. Skúste znovu za ${remainingTime} minút.`,
          type: 'rate_limited'
        };
      }
      
      // Call the login API endpoint
      const response = await authApi.login(email, password);

      // Extract data from response
      const { token, id, email: userEmail, emailConfirmed } = response;

      // Check if email is confirmed
      if (emailConfirmed === false) {
        return { 
          error: 'Please confirm your email address before logging in. Check your email for the confirmation link.', 
          type: 'email_not_confirmed' 
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
      secureLocalStorage.set('user', newUser);
      
      // Store token in localStorage
      secureLocalStorage.set('token', token);
      
      // Reset rate limiter on successful login
      loginRateLimiter.reset(identifier);
      
      // Set auth token for future API requests
      setAuthToken(token);

      // Defer fetching user's orders until the Order History tab is opened
      setHasLoadedOrders(false);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if the error message contains text about account not being activated
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Account not activated') || 
          errorMessage.includes('not activated') || 
          errorMessage.toLowerCase().includes('confirm your registration')) {
        return {
          error: 'Account not activated. Please check your email and confirm your registration.',
          type: 'email_not_confirmed'
        };
      }
      
      return false;
    }
  };

  // Logout function - makes an API call to the backend if a token exists
  const logout = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // If token exists, call the logout API endpoint
      if (token) {
        await authApi.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user data and token regardless of API call success
      setUser(null);
      secureLocalStorage.remove('user');
      secureLocalStorage.remove('token');
      
      // Reset orders loading flags
      setOrdersLoading(false);
      setHasLoadedOrders(false);
      
      // Remove auth token from future API requests
      removeAuthToken();
    }
  };

  // Fetch user profile data from backend
  const fetchProfile = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Fetch profile data from backend
      console.log("USER ID " + user.id);
      const profileData = await profileService.fetchProfile(user.id);
      
      // Create updated user object
      const updatedUser = {
        ...user,
        ...profileData,
        // Ensure we don't overwrite id, email, or orders
        id: user.id,
        email: user.email,
        orders: profileData.orders || user.orders
      };

      // Update state and localStorage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error('Fetch profile error:', error);
      return false;
    }
  };

  // Update user profile
  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      // Send profile update to backend
      const updatedProfileData = await profileService.updateProfile(user.id, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        address: profileData.address
      });
      
      // Create updated user object
      const updatedUser = {
        ...user,
        ...updatedProfileData,
        // Ensure we don't overwrite id, email, or orders
        id: user.id,
        email: user.email,
        orders: updatedProfileData.orders || user.orders
      };

      // Update state and localStorage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  // Fetch orders from backend and update user state
  const refreshOrders = async (): Promise<boolean> => {
    setOrdersLoading(true);
    try {
      const fetchedOrders = await ordersService.fetchMyOrders();
      // Determine the base user: prefer current state, else from localStorage
      let baseUser = user as User | null;
      if (!baseUser) {
        try {
          const stored = localStorage.getItem('user');
          baseUser = stored ? (JSON.parse(stored) as User) : null;
        } catch {
          baseUser = null;
        }
      }
      if (!baseUser) {
        return false;
      }
      const updatedUser: User = {
        ...baseUser,
        orders: fetchedOrders,
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return true;
    } catch (e) {
      console.error('Failed to fetch user orders:', e);
      return false;
    } finally {
      setOrdersLoading(false);
      setHasLoadedOrders(true);
    }
  };

  // Add an order to user's order history
  const addOrder = (order: Omit<Order, 'id' | 'date'>) => {
    if (!user) return;

    // Create new order with id and date
    const newOrder: Order = {
      ...order,
      id: Math.random().toString(36).substr(2, 9), // Generate a random ID
      date: new Date().toISOString()
    };

    // Add order to user's order history
    const updatedUser = {
      ...user,
      orders: [...user.orders, newOrder]
    };

    // Update state and localStorage
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Get user's order history
  const getOrders = (): Order[] => {
    return user?.orders || [];
  };

  // Request password reset (forgot password)
  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authApi.forgotPassword(email);
      return {
        success: true,
        message: response.message || 'Password reset email sent successfully. Please check your email.'
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Failed to send password reset email. Please try again.'
      };
    }
  };

  // Reset password with token
  const resetPassword = async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authApi.resetPassword(token, password);
      return {
        success: true,
        message: response.message || 'Password reset successfully. You can now login with your new password.'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Failed to reset password. The token may be invalid or expired.'
      };
    }
  };

  // Provide the auth context to children components
  return (
    <AuthContext.Provider value={{
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
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};