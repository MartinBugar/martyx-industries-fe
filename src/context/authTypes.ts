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
  name: string;
  email: string;
  // Additional profile information
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
  // Order history
  orders: Order[];
}