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
  orderNumber?: string | number;
  amount?: number | string;
  currency?: string;
  paymentMethod?: 'PAYPAL' | string;
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'FAILED' | string;
  transactionId?: string;
  payerId?: string | null;
  payerEmail?: string;
  paymentUrl?: string | null;

  // Legacy single-link fields
  downloadUrl?: string | null;
  invoiceDownloadUrl?: string | null;

  // New convenience all-products fields
  allProductsDownloadUrl?: string | null;
  allProductsDownloadToken?: string | null;

  // Arrays (preferred)
  downloadUrls?: string[];
  downloadTokens?: string[];
  invoiceDownloadUrls?: string[];
  invoiceDownloadTokens?: string[];

  // Legacy single token fields (backward compatibility)
  downloadToken?: string | null;
  invoiceDownloadToken?: string | null;

  // Structured per-product mapping (preferred for rendering)
  downloadLinks?: Array<{
    productId?: number;
    productName?: string | null;
    url: string;
    token: string;
  }>;

  // Order items for receipts/summary UI
  orderItems?: Array<{
    productId?: number;
    productName?: string | null;
    quantity?: number;
    unitPrice?: number | string;
  }>;

  errorMessage?: string | null;
  createdAt?: string; // ISO date
  updatedAt?: string; // ISO date
  completedAt?: string | null; // ISO date
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


