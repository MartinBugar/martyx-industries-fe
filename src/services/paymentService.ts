import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

export interface PaymentOrderItemDTO {
  product: { id: string; name: string };
  quantity: number;
  price?: number;
  currency: string;
}

export interface PaymentOrderDTO {
  orderItems: PaymentOrderItemDTO[];
  totalAmount: number;
  currency: string;
  // For guest checkout, only email is required
  user?: { id?: string; email: string };
}

export interface PaymentDTO {
  id?: number;
  paymentReference?: string;
  orderId?: number;
  amount: number;
  currency?: string;
  paymentMethod?: 'PAYPAL' | string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'FAILED';
  transactionId?: string;
  payerId?: string | null;
  payerEmail?: string;
  paymentUrl?: string;
  // Optional download info returned by backend after successful payment
  // Backend may return a single URL (including token) or an array per item
  downloadUrl?: string;
  downloadUrls?: string[];
  // Or backend may return token(s) only; FE should then construct /api/download/{token}
  downloadToken?: string;
  downloadTokens?: string[];
  errorMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
}

export const paymentService = {
  createPayPalPayment: async (order: PaymentOrderDTO): Promise<PaymentDTO> => {
    // Provide frontend success/cancel URLs so backend redirects back to our app after PayPal approval
    const origin = window.location.origin;
    const successUrl = `${origin}/payment/paypal/success`;
    const cancelUrl = `${origin}/payment/paypal/cancel`;

    // Extend payload with redirect URLs (backend can choose to use these)
    const payload: PaymentOrderDTO & { successUrl: string; cancelUrl: string } = { ...order, successUrl, cancelUrl };

    const response = await fetch(`${API_BASE_URL}/api/payments/paypal/create`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    });
    return (await handleResponse(response)) as PaymentDTO;
  },

  executePayPalPayment: async (paymentId: string, payerEmail: string): Promise<PaymentDTO> => {
    const url = new URL(`${API_BASE_URL}/api/payments/paypal/success`);
    url.searchParams.set('paymentId', paymentId);
    url.searchParams.set('PayerEmail', payerEmail);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    return (await handleResponse(response)) as PaymentDTO;
  },

  cancelPayPalPayment: async (paymentId: string) => {
    const url = new URL(`${API_BASE_URL}/api/payments/paypal/cancel`);
    url.searchParams.set('paymentId', paymentId);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    return await handleResponse(response);
  },

  getPaymentDetails: async (paymentId: string): Promise<PaymentDTO> => {
    const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}`, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    return (await handleResponse(response)) as PaymentDTO;
  },
};


