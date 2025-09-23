/**
 * Types for the unified API contract
 */

// Unified Error Response from Backend
export interface ApiErrorResponse {
  timestamp: string;
  path: string;
  errorCode: string;
  args: Record<string, any>;
}

// Product DTO from Backend
export interface ProductDto {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  sku: string;
  category: string | null;
  currency: string;
  productType: 'DIGITAL' | 'PHYSICAL';
  active: boolean;
}

// Paginated Response from Backend
export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// PayPal Order Creation
export interface CreatePaymentRequest {
  orderItems: Array<{
    product: { id: number };
    quantity: number;
    price: number;
    currency: string;
  }>;
  totalAmount: number;
  currency: string;
  user: { 
    email: string;
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface CreateOrderResponse {
  id: string;
  status: string;
  orderNumber: string;
}

export interface CaptureOrderRequest {
  orderId: string;
}

export interface PaymentDTO {
  paymentMethod: string;
  status: string;
  paymentUrl: string;
  orderId: string;
}

// Meta endpoints
export type SupportedLocales = string[];

// Common API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
}

// API Error mapping for frontend
export const API_ERROR_CODES = {
  ERR_NOT_FOUND: 'errors.not_found',
  ERR_BAD_REQUEST: 'errors.bad_request', 
  ERR_INTERNAL: 'errors.server_error',
  ERR_UNAUTHORIZED: 'errors.unauthorized',
  ERR_FORBIDDEN: 'errors.forbidden',
  ERR_VALIDATION: 'errors.validation',
  ERR_PAYMENT_FAILED: 'errors.payment_failed',
  ERR_INSUFFICIENT_STOCK: 'errors.insufficient_stock',
  ERR_INVALID_CREDENTIALS: 'errors.invalid_credentials',
  ERR_EMAIL_EXISTS: 'errors.email_already_exists',
  ERR_WEAK_PASSWORD: 'errors.weak_password',
  ERR_SESSION_EXPIRED: 'errors.session_expired',
} as const;

export type ApiErrorCode = keyof typeof API_ERROR_CODES;

// Contact Form Types
export interface ContactFormRequest {
  email: string;
  subject: string;
  text: string;
}

export interface ContactFormResponse {
  message: string;
}