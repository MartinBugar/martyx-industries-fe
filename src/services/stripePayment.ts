// Minimal Stripe Payment Request integration using global Stripe.js
// This mounts a Payment Request Button if supported and a publishable key is provided

const STRIPE_PK = import.meta.env.VITE_STRIPE_PK as string | undefined;

declare global {
  interface Window { Stripe?: StripeInitializer }
}

type StripeInitializer = (pk: string) => StripeLike;
interface StripeLike {
  elements(): ElementsLike;
  paymentRequest(options: PaymentRequestInitLike): PaymentRequestLike;
}
interface ElementsLike {
  create(type: 'paymentRequestButton', options: { paymentRequest: PaymentRequestLike; style?: { paymentRequestButton?: { type?: 'default' | 'donate' | 'buy'; theme?: 'dark' | 'light' | 'light-outline'; height?: string } } }): { mount: (selector: string) => void };
}
interface PaymentRequestInitLike {
  country: string;
  currency: string;
  total: { label: string; amount: number };
  requestPayerName?: boolean;
  requestPayerEmail?: boolean;
}
interface PaymentRequestLike {
  canMakePayment(): Promise<unknown>;
  on(event: 'paymentmethod', handler: (ev: PaymentMethodEventLike) => void): void;
}
interface PaymentMethodEventLike {
  complete: (status: 'success' | 'fail' | 'unknown') => Promise<void> | void;
}

export interface PaymentRequestOptions {
  amount: number; // amount in minor units (e.g., cents)
  currency?: string; // e.g., 'usd'
  label?: string; // e.g., 'Order total'
}

export async function mountPaymentRequestButton(containerId: string, opts: PaymentRequestOptions): Promise<{ mounted: boolean; reason?: string }> {
  try {
    if (!window.Stripe) {
      return { mounted: false, reason: 'Stripe.js not loaded' };
    }
    if (!STRIPE_PK) {
      return { mounted: false, reason: 'Missing VITE_STRIPE_PK' };
    }
    const currency = (opts.currency || 'usd').toLowerCase();
    const label = opts.label || 'Order';

    const stripe = window.Stripe(STRIPE_PK);
    const elements = stripe.elements();

    const paymentRequest = stripe.paymentRequest({
      country: 'US',
      currency,
      total: { label, amount: Math.round(opts.amount) },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    const canMake = await paymentRequest.canMakePayment();
    if (!canMake) {
      return { mounted: false, reason: 'Payment Request not available' };
    }

    paymentRequest.on('paymentmethod', async (ev) => {
      // No backend Stripe intent integration yet; fail gracefully and guide user
      try {
        // Inform browser that payment details are not processed here
        await ev.complete('fail');
      } finally {
        alert('Apple Pay / Google Pay is not yet enabled. Please use the PayPal checkout below.');
      }
    });

    const prButton = elements.create('paymentRequestButton', {
      paymentRequest,
      style: { paymentRequestButton: { type: 'default', theme: 'dark', height: '44px' } },
    });

    prButton.mount(`#${containerId}`);

    return { mounted: true };
  } catch (e) {
    console.warn('[Stripe] Failed to mount Payment Request Button:', e);
    return { mounted: false, reason: 'Error mounting PRB' };
  }
}
