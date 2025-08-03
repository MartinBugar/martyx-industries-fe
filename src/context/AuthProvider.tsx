import React, { useState, type ReactNode, useEffect } from 'react';
import type { User } from './authTypes';
import type { Order } from './authTypes';
import { AuthContext } from './AuthContext';
import { authApi, setAuthToken, removeAuthToken } from '../services/api';

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component to wrap the app and provide authentication functionality
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // In a real application, you would store this in a more secure way
  // and validate against a backend server
  const [user, setUser] = useState<User | null>(null);
  
  // Check if user and token are stored in localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    // If token exists, set it for API requests
    if (token) {
      setAuthToken(token);
    }
    
    // If user exists, set it in state
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        removeAuthToken();
      }
    }
  }, []);

  // Login function - makes an API call to the backend
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Call the login API endpoint
      const response = await authApi.login(email, password);
      
      // Extract data from response
      const { token, userId, email: userEmail } = response;
      
      // Create user object from response data
      const newUser: User = {
        id: userId,
        email: userEmail,
        orders: [] // Initialize empty orders array
      };
      
      // Store user data in state and localStorage
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Set auth token for future API requests
      setAuthToken(token);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
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
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Remove auth token from future API requests
      removeAuthToken();
    }
  };

  // Update user profile
  const updateProfile = (profileData: Partial<User>) => {
    if (!user) return;

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

  // Provide the auth context to children components
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      updateProfile,
      addOrder,
      getOrders
    }}>
      {children}
    </AuthContext.Provider>
  );
};