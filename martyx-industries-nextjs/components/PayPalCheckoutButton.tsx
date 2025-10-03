'use client';

import { useCallback, useMemo } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import type { CartItem } from "../context/cartContextTypes";

type Props = {
  items: CartItem[];
  totalAmount: number;
  currency?: string; // e.g., "EUR"
  email?: string; // guest or logged-in user's email
  firstName?: string;
  lastName?: string;
  cartHash: string | number; // changes whenever cart content/total changes
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  onSuccess: (capture: unknown) => void;
  onError: (err: unknown) => void;
};

export default function PayPalCheckoutButton({ 
  items, 
  totalAmount, 
  currency = "EUR", 
  email, 
  firstName, 
  lastName, 
  cartHash, 
  billingAddress, 
  onSuccess, 
  onError 
}: Props) {

  // Create order on server
  const createOrder = useCallback(async () => {
    // Construct billing address string if provided
    const billingAddressString = billingAddress ? 
      `${billingAddress.street}, ${billingAddress.city}, ${billingAddress.state} ${billingAddress.postalCode}, ${billingAddress.country}` 
      : undefined;

    const payload = {
      orderItems: items.map(i => ({
        product: { id: Number(i.product.id) },
        quantity: i.quantity,
        price: Number(i.product.price),
        currency: (i.product.currency || currency).toUpperCase()
      })),
      totalAmount: Number(totalAmount.toFixed(2)),
      currency: currency.toUpperCase(),
      user: email && email.trim() ? { 
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        street: billingAddress?.street || '',
        city: billingAddress?.city || '',
        state: billingAddress?.state || '',
        zipCode: billingAddress?.postalCode || '',
        country: billingAddress?.country || ''
      } : null,
      billingAddress: billingAddressString
    };

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL is not configured');
    }

    const res = await fetch(`${API_BASE_URL}/api/paypal/create-order`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Create order failed: ${msg}`);
    }

    const data = await res.json();
    if (!data?.id) throw new Error("Server did not return order id.");
    return data.id as string;
  }, [items, totalAmount, currency, email, firstName, lastName, billingAddress]);

  // Ensure cartHash is always a valid value for forceReRender
  const safeCartHash = useMemo(() => {
    return cartHash?.toString() || 'default';
  }, [cartHash]);

  // Capture on server after approval
  const onApprove = useCallback(async (data: { orderID: string }) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL is not configured');
    }

    const res = await fetch(`${API_BASE_URL}/api/paypal/capture-order`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orderId: data.orderID })
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Capture failed: ${msg}`);
    }

    const capture = await res.json();
    onSuccess(capture);
  }, [onSuccess]);

  // PayPal button styles
  const walletStyle = {
    layout: 'horizontal' as const,
    color: 'white' as const,
    shape: 'rect' as const,
    height: 48,
    tagline: false
  };

  const cardStyle = {
    layout: 'horizontal' as const,
    color: 'black' as const,
    shape: 'rect' as const,
    height: 48
  };

  return (
    <div className="paypal-checkout-container">
      <PayPalButtons
        key={`paypal-${safeCartHash}`}
        style={walletStyle}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        onCancel={() => {
          console.log('PayPal payment cancelled by user');
        }}
        fundingSource="paypal"
        forceReRender={[safeCartHash, currency || 'EUR', 'capture']}
      />
      
      <PayPalButtons
        key={`card-${safeCartHash}`}
        style={cardStyle}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        onCancel={() => {
          console.log('Card payment cancelled by user');
        }}
        fundingSource="card"
        forceReRender={[safeCartHash, currency || 'EUR', 'capture']}
      />
    </div>
  );
}
