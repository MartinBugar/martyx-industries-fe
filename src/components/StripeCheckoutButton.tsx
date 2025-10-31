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
  disabled = false
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
          currency: i.product.currency.toUpperCase()
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
        }
      );

      console.log('Creating Stripe Checkout Session...', request);

      const sessionResponse = await stripeService.createCheckoutSession(request);

      console.log('Session created, redirecting to Stripe...', sessionResponse);

      // Redirect to Stripe Checkout
      if (sessionResponse.url) {
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
      style={{
        width: '100%',
        padding: '16px 24px',
        backgroundColor: '#635BFF',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(99, 91, 255, 0.25)',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.backgroundColor = '#5147EC';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 91, 255, 0.35)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.backgroundColor = '#635BFF';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 91, 255, 0.25)';
        }
      }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-block',
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          Processing...
        </span>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor">
            <path d="M48 32C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48H48zm392 160c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h168z"/>
          </svg>
          Proceed to Secure Checkout
        </span>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
