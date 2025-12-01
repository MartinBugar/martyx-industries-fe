import React, { useState, type ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { User } from './authTypes';
import type { Order } from './authTypes';
import { AuthContext } from './AuthContext';
import { authApi, setAuthToken, removeAuthToken } from '../services/api';
import { profileService } from '../services/profileService';
import { isTokenExpired } from '../services/apiUtils';
import { ordersService } from '../services/ordersService';
import { secureLocalStorage, loginRateLimiter } from '../utils/security';
import { startTokenRefresh, stopTokenRefresh, refreshAccessToken } from '../utils/tokenRefresh';
import { logInfo, logError } from '../services/logger';
import { getCSRFToken } from '../utils/csrf';
import { API_BASE_URL } from '../services/apiUtils';

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
  
  /**
   * Initialize CSRF token by calling backend endpoint.
   * This ensures XSRF-TOKEN cookie is set before any authenticated requests.
   */
  const initializeCSRF = async (): Promise<boolean> => {
    try {
      const csrfToken = getCSRFToken();
      if (!csrfToken) {
        logInfo('🔒 CSRF token missing, initializing...');
        // Call CSRF endpoint to generate token cookie
        await fetch(`${API_BASE_URL}/api/auth/csrf`, {
          method: 'GET',
          credentials: 'include', // Required to receive cookie
        });

        // Wait a moment for browser to write cookie
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify cookie was set
        const newToken = getCSRFToken();
        if (newToken) {
          logInfo('✅ CSRF token initialized successfully:', newToken.substring(0, 20) + '...');
          return true;
        } else {
          logError('❌ CSRF token not found after initialization - cookie may be blocked');
          return false;
        }
      } else {
        logInfo('✅ CSRF token already exists:', csrfToken.substring(0, 20) + '...');
        return true;
      }
    } catch (error) {
      logError('❌ Failed to initialize CSRF token:', error);
      // Non-critical error - don't block app initialization
      return false;
    }
  };

  // Check if user and token are stored in localStorage on initial load
  useEffect(() => {
    const init = async () => {
      logInfo('🔄 AuthProvider init started');

      // STEP 1: Initialize CSRF token FIRST (required for refresh/logout)
      await initializeCSRF();

      // Try both secureLocalStorage and regular localStorage for compatibility
      let storedUser = secureLocalStorage.get('user', null);
      let token: string | null = secureLocalStorage.get('token', null);
      
      // Fallback to regular localStorage if secureLocalStorage is empty
      if (!token) {
        const tokenRaw = localStorage.getItem('token');
        if (tokenRaw) {
          // Token is now stored as plain string, no JSON parsing needed
          token = tokenRaw;
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
      
      logInfo('📦 Stored data:', { hasUser: !!storedUser, hasToken: !!token, tokenType: typeof token });
      
      // Check if token exists and is valid
      if (token && typeof token === 'string') {
        // Check if token is expired
        if (isTokenExpired(token)) {
          logInfo('❌ Access token has expired, attempting refresh');
          const refreshSuccess = await refreshAccessToken();

          if (refreshSuccess && storedUser) {
            logInfo('✅ Token refreshed successfully, setting user');
            setUser(storedUser as User);

            // Start auto-refresh timer
            startTokenRefresh();
          } else {
            logInfo('❌ Token refresh failed, logging out user');
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
          logInfo('✅ Token is valid, setting auth');
          // Token is valid, set it for API requests
          setAuthToken(token);

          // Start auto-refresh timer (refresh token is in httpOnly cookie)
          logInfo('🔄 Starting auto-refresh timer');
          startTokenRefresh();

          // If user exists, set it in state
          if (storedUser && typeof storedUser === 'object') {
            try {
              logInfo('👤 Setting user from stored data');
              setUser(storedUser as User);
            } catch (error) {
              logError('❌ Failed to parse stored user:', error);
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
            logInfo('⚠️ No stored user found');
          }

          // Defer fetching orders until the user opens the Order History tab
        }
      } else {
        logInfo('🚫 No valid token found');
      }
      
      // Set loading to false after attempting to restore authentication state
      logInfo('🏁 AuthProvider init completed, isLoading: false');
      setIsLoading(false);
    };
    void init();
  }, []);

  // Listen for 401 logout events from API calls
  useEffect(() => {
    const handleAuthLogout = (event: CustomEvent) => {
      const reason = event.detail?.reason || 'unknown';
      logInfo('Received auth:logout event, updating authentication state. Reason:', reason);
      stopTokenRefresh();
      setUser(null);
      secureLocalStorage.remove('user');
      secureLocalStorage.remove('token');
      // Note: refreshToken is now in httpOnly cookie, cleared by backend
      localStorage.removeItem('user');
      localStorage.removeItem('token');
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
  const login = useCallback(async (email: string, password: string): Promise<boolean | { error: string; type: string }> => {
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
      // Note: refreshToken is now in httpOnly cookie, not in response body
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
        id: String(id), // Convert id to string
        email: userEmail,
        orders: [] // Initialize empty orders array
      };

      logInfo('🔐 Login response:', { token, id, userEmail, emailConfirmed });
      logInfo('👤 Created user object:', newUser);

      // Store user data in state and localStorage
      setUser(newUser);
      logInfo('💾 Stored user in state:', newUser);
      logInfo('✅ isAuthenticated should now be:', !!newUser);
      secureLocalStorage.set('user', newUser);
      localStorage.setItem('user', JSON.stringify(newUser)); // Also store in regular localStorage

      // Store access token in localStorage (as plain string, not JSON)
      logInfo('🔑 Storing access token');
      secureLocalStorage.set('token', token);
      localStorage.setItem('token', token); // Store as plain string, not JSON

      // Refresh token is now in httpOnly cookie (set by backend)
      // Start auto-refresh timer to keep access token fresh
      logInfo('🔄 Starting auto-refresh timer');
      startTokenRefresh();

      // Reset rate limiter on successful login
      loginRateLimiter.reset(identifier);

      // Set auth token for future API requests
      setAuthToken(token);

      // Defer fetching user's orders until the Order History tab is opened
      setHasLoadedOrders(false);

      // CRITICAL: Ensure CSRF token exists BEFORE dispatching cart:merge
      // Cart merge is a POST request that requires CSRF protection
      logInfo('🔒 Ensuring CSRF token exists before cart merge...');
      const csrfReady = await initializeCSRF();

      if (!csrfReady) {
        logError('⚠️ CSRF token initialization failed - cart merge may fail');
        // Continue anyway - cart merge will fail but user stays logged in
      }

      // Dispatch cart merge event (CartContext will handle merging)
      logInfo('🛒 Dispatching cart:merge event');
      window.dispatchEvent(new CustomEvent('cart:merge'));

      return true;
    } catch (error) {
      logError('Login error:', error);

      // Check if the error is about account not being activated
      // The error can come in multiple forms:
      // 1. error.errorData.code = "ACCOUNT_NOT_VERIFIED" (new BE response)
      // 2. error.message = "ACCOUNT_DISABLED" (old errorCode from BE)
      // 3. error.errorData.message contains activation text
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorData = (error as { errorData?: { message?: string; code?: string } }).errorData;
      const beMessage = errorData?.message || '';
      const beCode = errorData?.code || '';

      if (beCode === 'ACCOUNT_NOT_VERIFIED' ||
          errorMessage === 'ACCOUNT_DISABLED' ||
          beCode === 'ACCOUNT_DISABLED' ||
          errorMessage.includes('Account not activated') ||
          errorMessage.includes('not activated') ||
          errorMessage.toLowerCase().includes('confirm your registration') ||
          beMessage.includes('nie je aktivovaný') ||
          beMessage.includes('Account not activated') ||
          beMessage.includes('not activated') ||
          beMessage.toLowerCase().includes('confirm your registration')) {
        return {
          error: beMessage || 'Váš účet nie je aktivovaný. Skontrolujte svoj email a potvrďte registráciu.',
          type: 'email_not_confirmed'
        };
      }

      return false;
    }
  }, []);

  // Logout function - makes an API call to the backend if a token exists
  const logout = useCallback(async () => {
    try {
      // Stop auto-refresh timer
      stopTokenRefresh();

      // SECURITY: Ensure CSRF token exists before calling logout endpoint
      // The logout endpoint requires CSRF protection because it reads refreshToken from httpOnly cookie
      const csrfToken = getCSRFToken();
      if (!csrfToken) {
        logInfo('🔒 CSRF token missing before logout, initializing...');
        await initializeCSRF();
      }

      // Call logout API endpoint to clear httpOnly cookie
      await authApi.logout();
    } catch (error) {
      logError('Logout error:', error);
    } finally {
      // Clear user data and token regardless of API call success
      setUser(null);
      secureLocalStorage.remove('user');
      secureLocalStorage.remove('token');
      localStorage.removeItem('user'); // Also clear regular localStorage
      localStorage.removeItem('token'); // Also clear regular localStorage
      // Note: refreshToken cookie is cleared by backend /logout endpoint

      // CRITICAL: Clear shopping cart on logout
      // This prevents cart from persisting across different user sessions
      logInfo('[Auth] Clearing shopping cart on logout');
      localStorage.removeItem('martyx_cart_v1');
      localStorage.removeItem('martyx_session_id'); // Also clear guest session ID

      // Reset orders loading flags
      setOrdersLoading(false);
      setHasLoadedOrders(false);

      // Remove auth token from future API requests
      removeAuthToken();
    }
  }, []);

  // Fetch user profile data from backend
  const fetchProfile = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Fetch profile data from backend
      logInfo("USER ID " + user.id);
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
      logError('Fetch profile error:', error);
      return false;
    }
  }, [user]);

  // Update user profile
  const updateProfile = useCallback(async (profileData: Partial<User>): Promise<boolean> => {
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
      logError('Update profile error:', error);
      return false;
    }
  }, [user]);

  // Fetch orders from backend and update user state
  const refreshOrders = useCallback(async (): Promise<boolean> => {
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
      logError('Failed to fetch user orders:', e);
      return false;
    } finally {
      setOrdersLoading(false);
      setHasLoadedOrders(true);
    }
  }, [user]);

  // Add an order to user's order history
  const addOrder = useCallback((order: Omit<Order, 'id' | 'date'>) => {
    if (!user) return;

    // Create new order with id and date
    // Use crypto.randomUUID() for cryptographically secure unique IDs
    const newOrder: Order = {
      ...order,
      id: crypto.randomUUID(),
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
  }, [user]);

  // Get user's order history
  const getOrders = useCallback((): Order[] => {
    return user?.orders || [];
  }, [user]);

  // Request password reset (forgot password)
  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authApi.forgotPassword(email);
      return {
        success: true,
        message: response.message || 'Password reset email sent successfully. Please check your email.'
      };
    } catch (error) {
      logError('Forgot password error:', error);
      return {
        success: false,
        message: 'Failed to send password reset email. Please try again.'
      };
    }
  }, []);

  // Reset password with token
  const resetPassword = useCallback(async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authApi.resetPassword(token, password);
      return {
        success: true,
        message: response.message || 'Password reset successfully. You can now login with your new password.'
      };
    } catch (error) {
      logError('Reset password error:', error);
      return {
        success: false,
        message: 'Failed to reset password. The token may be invalid or expired.'
      };
    }
  }, []);

  // PERFORMANCE: Memoize context value to prevent unnecessary re-renders
  // Without this, every state change creates a new object and triggers ALL consumers to re-render
  const contextValue = useMemo(() => ({
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
  }), [
    user,
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
  ]);

  // Provide the auth context to children components
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};