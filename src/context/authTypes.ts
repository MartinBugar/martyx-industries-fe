// Define the structure of an order
export interface Order {
  id: string;
  // Backend numeric ID for API operations (kept separate from display id/orderNumber)
  backendId?: string;
  date: string;
  items: Array<{
    id: string; // OrderItem ID - required for digital product downloads
    productId: string; // Master Product ID
    variantId?: string; // Variant ID (if applicable)
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
  // New fields for enhanced features
  invoiceNumber?: string;
  invoicePdfUrl?: string;
  discountCode?: string;
  discountAmount?: number;
  shippingCost?: number;
  shippingCarrier?: string;
  shippingTrackingNumber?: string;
  subtotal?: number;
  taxAmount?: number;
  // Physical product shipping/fulfillment tracking
  shippingStatus?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  estimatedDeliveryDate?: string;
  fulfillmentStatus?: string;
  hasPhysicalItems?: boolean;
  hasDigitalItems?: boolean;
  // Cancellation info
  cancelledAt?: string;
  cancellationReason?: string;
}

// Define the structure of an avatar
export interface Avatar {
  id: number;
  name: string;
  imageUrl: string;
  description?: string;
  active?: boolean;
}

// Define the structure of a user
export interface User {
  id: string;
  email: string;
  // Order history
  orders: Order[];
  // Optional fields for backward compatibility
  name?: string;
  username?: string;
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
  // Avatar support
  avatar?: Avatar;
  avatarUrl?: string; // Convenience property for quick access
  // Customer metrics fields
  totalOrders?: number;
  totalSpent?: number;
  averageOrderValue?: number;
  lastOrderDate?: string; // ISO date string
  firstOrderDate?: string; // ISO date string
  customerLifetimeValue?: number;
  customerTier?: string; // BRONZE, SILVER, GOLD, PLATINUM
  isVip?: boolean;
  riskScore?: number;
  lastActivityAt?: string; // ISO date string
}

// Define the authentication response from the backend
export interface AuthResponse {
  token: string;
  refreshToken?: string; // Refresh token for extended sessions (30 days)
  id: string;
  email: string;
  emailConfirmed?: boolean;
}

// Define the login error response
export interface LoginErrorResponse {
  error: string;
  type: string;
  // Account lockout information (returned when account is locked)
  accountLocked?: boolean;
  lockedUntil?: string; // ISO 8601 datetime string
  remainingSeconds?: number;
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