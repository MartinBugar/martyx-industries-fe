import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import type { BillingAddress } from '../types/api';

export interface CreateCheckoutSessionRequest {
  orderItems: Array<{
    product: { id: number };
    quantity: number;
    price: number;
    currency: string;
  }>;
  totalAmount: number;
  currency: string;
  user?: BillingAddress; // Optional for guest checkout
  discountCode?: string;
  shippingRateId?: number;
  shippingCost?: number;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
  orderNumber: string;
  orderId: number;
}

export interface StripeSuccessResponse {
  id?: number;
  orderId?: number;
  orderNumber?: string;
  status?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  transactionId?: string;
  payerEmail?: string;
  downloadUrl?: string;
  downloadUrls?: string[];
  downloadToken?: string;
  downloadTokens?: string[];
  downloadLinks?: Array<{
    productId?: string | number;
    productName?: string;
    url?: string;
    token?: string;
  }>;
  orderItems?: Array<{
    productId?: string | number;
    productName?: string;
    quantity?: number;
    unitPrice?: number;
  }>;
  invoiceDownloadUrl?: string;
  invoiceDownloadUrls?: string[];
  invoiceDownloadToken?: string;
  invoiceDownloadTokens?: string[];
}

/**
 * Service for Stripe payment processing with unified API contract
 */
export class StripeService {
  /**
   * Create Stripe Checkout Session for guest checkout
   * @param request - Checkout session creation request with items and user info
   * @returns Promise<CreateCheckoutSessionResponse>
   */
  async createCheckoutSession(request: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/stripe/create-checkout-session`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(request),
    }));

    return handleResponse(response);
  }

  /**
   * Get payment success details from session
   * @param sessionId - Stripe Checkout Session ID (format: cs_xxx)
   * @returns Promise<StripeSuccessResponse>
   * @throws Error if sessionId is invalid
   */
  async getSuccessDetails(sessionId: string): Promise<StripeSuccessResponse> {
    // Validate session ID format (Stripe session IDs start with "cs_")
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Session ID is required');
    }

    const trimmedSessionId = sessionId.trim();
    if (trimmedSessionId.length === 0) {
      throw new Error('Session ID cannot be empty');
    }

    // Basic format validation - Stripe session IDs start with cs_ and contain alphanumeric + underscore
    if (!/^cs_[a-zA-Z0-9_]+$/.test(trimmedSessionId)) {
      throw new Error('Invalid session ID format');
    }

    const response = await fetch(`${API_BASE_URL}/api/stripe/payment-details?session_id=${encodeURIComponent(trimmedSessionId)}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));

    return handleResponse(response);
  }

  /**
   * Helper to create checkout session request from cart data
   * @param cartItems - Items from shopping cart
   * @param totalAmount - Total amount to charge
   * @param currency - Currency code (default: EUR)
   * @param userInfo - User/billing information
   * @returns CreateCheckoutSessionRequest
   */
  createCheckoutRequest(
    cartItems: Array<{
      id: number;
      quantity: number;
      price: number;
      currency?: string;
    }>,
    totalAmount: number,
    currency: string = 'EUR',
    userInfo?: {
      email?: string;
      firstName?: string;
      lastName?: string;
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      isCompany?: boolean;
      companyName?: string;
      companyId?: string;
      taxId?: string;
      vatId?: string;
    }
  ): CreateCheckoutSessionRequest {
    const orderItems = cartItems.map(item => ({
      product: { id: item.id },
      quantity: item.quantity,
      price: item.price,
      currency: item.currency || currency
    }));

    return {
      orderItems,
      totalAmount,
      currency: currency.toUpperCase(),
      user: userInfo ? {
        email: userInfo.email || '',
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        street: userInfo.street || '',
        city: userInfo.city || '',
        state: userInfo.state || '',
        zipCode: userInfo.zipCode || '',
        country: userInfo.country || '',
        isCompany: userInfo.isCompany || false,
        companyName: userInfo.companyName || '',
        companyId: userInfo.companyId || '',
        taxId: userInfo.taxId || '',
        vatId: userInfo.vatId || ''
      } : undefined
    };
  }
}

export const stripeService = new StripeService();
