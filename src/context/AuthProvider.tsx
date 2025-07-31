import React, { useState, type ReactNode, useEffect } from 'react';
import type { User } from './authTypes';
import type { Order } from './authTypes';
import { AuthContext } from './AuthContext';

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component to wrap the app and provide authentication functionality
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // In a real application, you would store this in a more secure way
  // and validate against a backend server
  const [user, setUser] = useState<User | null>(null);
  
  // Check if user is stored in localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Login function - in a real app, this would make an API call
  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo purposes, accept any non-empty email and password
    // In a real app, this would validate credentials against a backend
    if (email && password) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9), // Generate a random ID
        name: email.split('@')[0], // Use part of email as name for demo
        email,
        orders: [] // Initialize empty orders array
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return true;
    }
    
    return false;
  };

  // Register function - in a real app, this would make an API call
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo purposes, accept any non-empty values
    // In a real app, this would send registration data to a backend
    if (name && email && password) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9), // Generate a random ID
        name,
        email,
        orders: [] // Initialize empty orders array
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return true;
    }
    
    return false;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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
      register,
      logout,
      updateProfile,
      addOrder,
      getOrders
    }}>
      {children}
    </AuthContext.Provider>
  );
};