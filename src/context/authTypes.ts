// Define the structure of an order
export interface Order {
  id: string;
  date: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'completed' | 'processing' | 'cancelled';
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

// Define the authentication response from the backend
export interface AuthResponse {
  token: string;
  id: string;
  email: string;
}