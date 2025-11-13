import { useState } from 'react';
import type { CartItem } from '../context/cartContextTypes';
import { stripeService } from '../services/stripeService';

type Props = {
  items: CartItem[];
  totalAmount: number;
  currency?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isCompany?: boolean;
    companyName?: string;
    companyId?: string;
    taxId?: string;
    vatId?: string;
  };
  onError: (err: unknown) => void;
  disabled?: boolean;
  creditsToApply?: number; // Optional: Amount of user credits to apply
  discountCode?: string; // Optional: Discount code to apply
};

export default function StripeCheckoutButton({
  items,
  totalAmount,
  currency = 'EUR',
  email,
  firstName,
  lastName,
  billingAddress,
  onError,
  disabled = false,
  creditsToApply,
  discountCode
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);

      // Create checkout session on backend
      const request = stripeService.createCheckoutRequest(
        items.map(i => ({
          id: Number(i.product.variantId),
          quantity: i.quantity,
          price: Number(i.product.priceWithVat),
          currency: (i.product.currency || 'EUR').toUpperCase()
        })),
        Number(totalAmount.toFixed(2)),
        currency.toUpperCase(),
        {
          email: email || '',
          firstName: firstName || '',
          lastName: lastName || '',
          street: billingAddress?.street || '',
          city: billingAddress?.city || '',
          state: billingAddress?.state || '',
          zipCode: billingAddress?.postalCode || '',
          country: billingAddress?.country || '',
          isCompany: billingAddress?.isCompany || false,
          companyName: billingAddress?.companyName || '',
          companyId: billingAddress?.companyId || '',
          taxId: billingAddress?.taxId || '',
          vatId: billingAddress?.vatId || ''
        },
        creditsToApply,
        discountCode
      );

      const sessionResponse = await stripeService.createCheckoutSession(request);

      // Redirect to Stripe Checkout
      if (sessionResponse.url) {
        // CRITICAL: Set flag BEFORE redirect to prevent cart sync after successful payment
        // This flag will be checked by CartContext when user returns from Stripe
        console.log('[StripeCheckout] Setting payment_in_progress flag before redirect');
        sessionStorage.setItem('payment_in_progress', 'true');

        window.location.href = sessionResponse.url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error) {
      console.error('Failed to create Stripe checkout:', error);
      setLoading(false);
      onError(error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading || totalAmount <= 0}
      className="stripe-checkout-button"
    >
      {loading ? (
        <>
          <span className="stripe-spinner" />
          Processing...
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor">
            <path d="M48 32C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48H48zm392 160c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h168z"/>
          </svg>
          Proceed to Secure Checkout
        </>
      )}
    </button>
  );
}
