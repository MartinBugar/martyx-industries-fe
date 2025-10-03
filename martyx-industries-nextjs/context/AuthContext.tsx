import { createContext } from 'react';

// Define the structure of an order
export interface Order {
  id: string;
  // Backend numeric ID for API operations (kept separate from display id/orderNumber)
  backendId?: string;
  date: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number; // unit price
    // optional product type returned by backend (e.g., DIGITAL, PHYSICAL, SUBSCRIPTION)
    productType?: string;
  }>;
  totalAmount: number;
  // Status comes from backend (e.g., PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED, etc.)
  // Keep it flexible to display the actual value from the database.
  status: string;
  // Optional fields coming from backend (if available)
  orderNumber?: string;
  userEmail?: string;
  currency?: string;
  paymentDate?: string;
  shippingAddress?: string;
  billingAddress?: string;
  paymentMethod?: string;
  paymentId?: string;
  notes?: string;
}

// Define the structure of a user
export interface User {
  id: string;
  email: string;
  // Order history
  orders: Order[];
  // Optional fields for backward compatibility
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

// Login error response structure
export interface LoginErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

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
  refreshOrders: () => Promise<boolean>;
  ordersLoading: boolean;
  hasLoadedOrders: boolean;
  // Password reset
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
