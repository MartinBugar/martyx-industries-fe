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
  paymentReference?: string;
  transactionId: string;
  amount: number;
  paymentMethod?: 'PAYPAL';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  paymentUrl?: string;
  payerEmail?: string;
}

export const paymentService = {
  createPayPalPayment: async (order: PaymentOrderDTO): Promise<PaymentDTO> => {
    const response = await fetch(`${API_BASE_URL}/api/payments/paypal/create`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(order),
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


