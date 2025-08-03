import { createContext } from 'react';
import type { User } from './authTypes';
import type { Order } from './authTypes';

// Define the shape of the auth context
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  // User profile management
  updateProfile: (profileData: Partial<User>) => void;
  // Order history management
  addOrder: (order: Omit<Order, 'id' | 'date'>) => void;
  getOrders: () => Order[];
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);