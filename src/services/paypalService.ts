import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import type { 
  CreatePaymentRequest, 
  CreateOrderResponse, 
  CaptureOrderRequest, 
  PaymentDTO 
} from '../types/api';

/**
 * Service for PayPal payment processing with unified API contract
 */
export class PayPalService {
  /**
   * Create PayPal order for guest checkout
   * @param request - Order creation request with items and user info
   * @returns Promise<CreateOrderResponse>
   */
  async createOrder(request: CreatePaymentRequest): Promise<CreateOrderResponse> {
    const response = await fetch(`${API_BASE_URL}/api/paypal/create-order`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(request),
    }));

    return handleResponse(response);
  }

  /**
   * Capture PayPal order after user approval
   * @param request - Capture request with PayPal order ID
   * @returns Promise<PaymentDTO>
   */
  async captureOrder(request: CaptureOrderRequest): Promise<PaymentDTO> {
    const response = await fetch(`${API_BASE_URL}/api/paypal/capture-order`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(request),
    }));

    return handleResponse(response);
  }

  /**
   * Helper to create order items from cart data
   * @param cartItems - Items from shopping cart
   * @returns Order items in the format expected by backend
   */
  createOrderItems(cartItems: Array<{
    id: number;
    quantity: number;
    price: number;
    currency?: string;
  }>): CreatePaymentRequest['orderItems'] {
    return cartItems.map(item => ({
      product: { id: item.id },
      quantity: item.quantity,
      price: item.price,
      currency: item.currency || 'USD'
    }));
  }

  /**
   * Calculate total amount from order items
   * @param orderItems - Array of order items
   * @returns Total amount
   */
  calculateTotal(orderItems: CreatePaymentRequest['orderItems']): number {
    return orderItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  /**
   * Create complete payment request from cart and user data
   * @param cartItems - Shopping cart items
   * @param userEmail - Customer email
   * @param currency - Payment currency (default: USD)
   * @returns Complete payment request
   */
  createPaymentRequest(
    cartItems: Array<{ id: number; quantity: number; price: number; currency?: string }>,
    userEmail: string,
    currency: string = 'USD'
  ): CreatePaymentRequest {
    const orderItems = this.createOrderItems(cartItems);
    const totalAmount = this.calculateTotal(orderItems);

    return {
      orderItems,
      totalAmount,
      currency,
      user: { email: userEmail }
    };
  }
}

export const paypalService = new PayPalService();
