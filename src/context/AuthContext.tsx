import { createContext } from 'react';
import type { User } from './authTypes';
import type { Order } from './authTypes';
import type { LoginErrorResponse } from './authTypes';

// Define the shape of the auth context
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean | LoginErrorResponse>;
  logout: () => Promise<void>;
  // User profile management
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  fetchProfile: () => Promise<boolean>;
  // Order history management
  addOrder: (order: Omit<Order, 'id' | 'date'>) => void;
  getOrders: () => Order[];
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);