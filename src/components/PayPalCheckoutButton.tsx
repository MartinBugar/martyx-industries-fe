import { useCallback, useMemo } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import type { CartItem } from "../context/cartContextTypes";
import { API_BASE_URL } from "../services/apiUtils";

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

export default function PayPalCheckoutButton({ items, totalAmount, currency = "EUR", email, firstName, lastName, cartHash, billingAddress, onSuccess, onError }: Props) {

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

  // Capture on server after approval
  const onApprove = useCallback(async (data: { orderID: string }) => {
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

  // Force re-render arrays (PayPal reads style only when forceReRender changes)
  // Wallet keeps its own constant height (48)
  // Card depends on CARD_HEIGHT computed below
  // NOTE: hooks must remain in consistent order
  // We'll declare styles first, then these hooks before return.

  // 1) štýl pre PayPal wallet (tmavé/white podľa chuti)
  const walletStyle = {
    layout: "vertical",
    shape: "rect",
    color: "gold",
    height: 48,
    label: "paypal",
    tagline: false
  } as const;

  // 2) štýl pre PayPal card – väčšia výška, voliteľne nižšia na mobile
  const isMobile = typeof window !== "undefined" && (window.matchMedia?.("(max-width: 480px)")?.matches ?? false);
  // PayPal SDK requires button height between 25px and 55px. Use 48 on mobile and 55 on larger screens.
  const CARD_HEIGHT = isMobile ? 48 : 55;
  const cardStyle = {
    layout: "horizontal",
    shape: "rect",
    color: "black",
    height: CARD_HEIGHT,
    label: "pay",
    tagline: false
  } as const;

  // force re-render arrays: separate for wallet and card (PayPal re-reads style on change)
  const forceReRenderWallet = useMemo(
    () => {
      // Ensure all values are serializable and not undefined
      const hash = cartHash?.toString() || 'default';
      const curr = currency || 'EUR';
      return [hash, curr, "capture", 48]; // 48 is wallet height
    },
    [cartHash, currency]
  );
  const forceReRenderCard = useMemo(
    () => {
      // Ensure all values are serializable and not undefined
      const hash = cartHash?.toString() || 'default';
      const curr = currency || 'EUR';
      const height = CARD_HEIGHT || 55;
      return [hash, curr, "capture", height];
    },
    [cartHash, currency, CARD_HEIGHT]
  );

  return (
    <div className="grid gap-3" style={{ minHeight: CARD_HEIGHT }}>
      {/* PAYPAL WALLET BUTTON */}
      <PayPalButtons
        fundingSource="paypal"
        style={walletStyle}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        forceReRender={forceReRenderWallet}
      />

      {/* PAYPAL CARD BUTTON */}
      <PayPalButtons
        fundingSource="card"
        style={cardStyle}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        forceReRender={forceReRenderCard}
      />

    </div>
  );
}
