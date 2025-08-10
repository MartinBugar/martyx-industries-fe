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
  // Status comes from backend (e.g., PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED, etc.)
  // Keep it flexible to display the actual value from the database.
  status: string;
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
  emailConfirmed?: boolean;
}

// Define the login error response
export interface LoginErrorResponse {
  error: string;
  type: string;
}

// Define the reset password request
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Define the forgot password request
export interface ForgotPasswordRequest {
  email: string;
}

// Define the reset password response
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}