import React, { useState, type ReactNode, useEffect } from 'react';
import type { User } from './authTypes';
import type { Order } from './authTypes';
import { AuthContext } from './AuthContext';
import { authApi, setAuthToken, removeAuthToken } from '../services/api';
import { profileService } from '../services/profileService';
import { isTokenExpired } from '../services/apiUtils';
import { ordersService } from '../services/ordersService';
import { secureLocalStorage, loginRateLimiter } from '../utils/security';
import { startTokenRefresh, stopTokenRefresh, refreshAccessToken } from '../utils/tokenRefresh';

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
          console.log('❌ Access token has expired, attempting refresh');
          const refreshSuccess = await refreshAccessToken();

          if (refreshSuccess && storedUser) {
            console.log('✅ Token refreshed successfully, setting user');
            setUser(storedUser as User);

            // Start auto-refresh timer
            startTokenRefresh();
          } else {
            console.log('❌ Token refresh failed, logging out user');
            // Clear expired token and user data including refresh token
            secureLocalStorage.remove('user');
            secureLocalStorage.remove('token');
            secureLocalStorage.remove('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            removeAuthToken();
            stopTokenRefresh();
            setUser(null);
          }
        } else {
          console.log('✅ Token is valid, setting auth');
          // Token is valid, set it for API requests
          setAuthToken(token);

          // Check if refresh token exists and start auto-refresh
          const refreshToken = secureLocalStorage.get('refreshToken', null) ||
            (localStorage.getItem('refreshToken') ? JSON.parse(localStorage.getItem('refreshToken')!) : null);

          if (refreshToken) {
            console.log('🔄 Starting auto-refresh timer');
            startTokenRefresh();
          }

          // If user exists, set it in state
          if (storedUser && typeof storedUser === 'object') {
            try {
              console.log('👤 Setting user from stored data');
              setUser(storedUser as User);
            } catch (error) {
              console.error('❌ Failed to parse stored user:', error);
              secureLocalStorage.remove('user');
              secureLocalStorage.remove('token');
              secureLocalStorage.remove('refreshToken');
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              removeAuthToken();
              stopTokenRefresh();
            }
          } else {
            console.log('⚠️ No stored user found');
          }

          // Defer fetching orders until the user opens the Order History tab
        }
      } else {
        console.log('🚫 No valid token found');
      }
      
      // Set loading to false after attempting to restore authentication state
      console.log('🏁 AuthProvider init completed, isLoading: false');
      setIsLoading(false);
    };
    void init();
  }, []);

  // Listen for 401 logout events from API calls
  useEffect(() => {
    const handleAuthLogout = (event: CustomEvent) => {
      const reason = event.detail?.reason || 'unknown';
      console.log('Received auth:logout event, updating authentication state. Reason:', reason);
      stopTokenRefresh();
      setUser(null);
      secureLocalStorage.remove('user');
      secureLocalStorage.remove('token');
      secureLocalStorage.remove('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      removeAuthToken();
    };

    window.addEventListener('auth:logout', handleAuthLogout as EventListener);

    // Cleanup event listener and stop refresh timer on component unmount
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout as EventListener);
      stopTokenRefresh();
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
      const { token, refreshToken, id, email: userEmail, emailConfirmed } = response;

      // Check if email is confirmed
      if (emailConfirmed === false) {
        return {
          error: 'Please confirm your email address before logging in. Check your email for the confirmation link.',
          type: 'email_not_confirmed'
        };
      }

      // Create user object from response data
      const newUser: User = {
        id: String(id), // Convert id to string
        email: userEmail,
        orders: [] // Initialize empty orders array
      };

      console.log('🔐 Login response:', { token, refreshToken, id, userEmail, emailConfirmed });
      console.log('👤 Created user object:', newUser);

      // Store user data in state and localStorage
      setUser(newUser);
      console.log('💾 Stored user in state:', newUser);
      console.log('✅ isAuthenticated should now be:', !!newUser);
      secureLocalStorage.set('user', newUser);
      localStorage.setItem('user', JSON.stringify(newUser)); // Also store in regular localStorage

      // Store access token in localStorage
      console.log('🔑 Storing access token');
      secureLocalStorage.set('token', token);
      localStorage.setItem('token', JSON.stringify(token)); // Also store in regular localStorage

      // Store refresh token if provided
      if (refreshToken) {
        console.log('🔄 Storing refresh token');
        secureLocalStorage.set('refreshToken', refreshToken);
        localStorage.setItem('refreshToken', JSON.stringify(refreshToken));

        // Start auto-refresh timer
        startTokenRefresh();
      }

      // Reset rate limiter on successful login
      loginRateLimiter.reset(identifier);

      // Set auth token for future API requests
      setAuthToken(token);

      // Defer fetching user's orders until the Order History tab is opened
      setHasLoadedOrders(false);

      // Dispatch cart merge event (CartContext will handle merging)
      console.log('🛒 Dispatching cart:merge event');
      window.dispatchEvent(new CustomEvent('cart:merge'));

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
      // Stop auto-refresh timer
      stopTokenRefresh();

      // Get token from secureLocalStorage
      const token = secureLocalStorage.get('token', null);

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
      secureLocalStorage.remove('refreshToken');
      localStorage.removeItem('user'); // Also clear regular localStorage
      localStorage.removeItem('token'); // Also clear regular localStorage
      localStorage.removeItem('refreshToken'); // Also clear refresh token

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
      
      // Create updated user object with avatar convenience property
      const updatedUser = {
        ...user,
        ...profileData,
        // Ensure we don't overwrite id, email, or orders
        id: user.id,
        email: user.email,
        orders: profileData.orders || user.orders,
        // Add avatarUrl convenience property from avatar.imageUrl
        avatarUrl: profileData.avatar?.imageUrl || user.avatarUrl
      };

      // Update state and secureLocalStorage
      setUser(updatedUser);
      secureLocalStorage.set('user', updatedUser);
      
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
        username: profileData.username,
        phone: profileData.phone,
        address: profileData.address
      });
      
      // Create updated user object with avatar convenience property
      const updatedUser = {
        ...user,
        ...updatedProfileData,
        // Ensure we don't overwrite id, email, or orders
        id: user.id,
        email: user.email,
        orders: updatedProfileData.orders || user.orders,
        // Add avatarUrl convenience property from avatar.imageUrl
        avatarUrl: updatedProfileData.avatar?.imageUrl || user.avatarUrl
      };

      // Update state and secureLocalStorage
      setUser(updatedUser);
      secureLocalStorage.set('user', updatedUser);
      
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
      // Determine the base user: prefer current state, else from secureLocalStorage
      let baseUser = user as User | null;
      if (!baseUser) {
        try {
          baseUser = secureLocalStorage.get('user', null);
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
      secureLocalStorage.set('user', updatedUser);
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

    // Update state and secureLocalStorage
    setUser(updatedUser);
    secureLocalStorage.set('user', updatedUser);
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