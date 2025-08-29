import { useCallback, useMemo } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import type { CartItem } from "../context/cartContextTypes";
import { API_BASE_URL } from "../services/apiUtils";
import CardPayViaHostedFields from "./checkout/CardPayViaHostedFields";

type Props = {
  items: CartItem[];
  totalAmount: number;
  currency?: string; // e.g., "EUR"
  email?: string; // guest or logged-in user's email
  cartHash: string | number; // changes whenever cart content/total changes
  onSuccess: (capture: unknown) => void;
  onError: (err: unknown) => void;
};

export default function PayPalCheckoutButton({ items, totalAmount, currency = "EUR", email, cartHash, onSuccess, onError }: Props) {

  // Create order on server
  const createOrder = useCallback(async () => {
    const payload = {
      orderItems: items.map(i => ({
        product: { id: Number(i.product.id) },
        quantity: i.quantity,
        price: Number(i.product.price),
        currency: (i.product.currency || currency).toUpperCase()
      })),
      totalAmount: Number(totalAmount.toFixed(2)),
      currency: currency.toUpperCase(),
      user: email && email.trim() ? { email } : null
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
  }, [items, totalAmount, currency, email]);

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

  // Force PayPalButtons to re-render when cart changes
  const forceReRender = useMemo(() => [cartHash, currency, "capture"], [cartHash, currency]);

  // 1) štýl pre PayPal wallet (tmavé/white podľa chuti)
  const walletStyle = {
    layout: "vertical",
    shape: "rect",
    color: "black",   // alebo "white" – vyber čo viac ladi
    height: 48,
    label: "paypal",
    tagline: false
  } as const;

  return (
    <div className="grid gap-3">
      {/* PAYPAL WALLET BUTTON */}
      <PayPalButtons
        style={walletStyle}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        forceReRender={forceReRender}
      />

      {/* HOSTED FIELDS – Kartova platba bez bieleho pruhu */}
      <CardPayViaHostedFields
        createOrder={createOrder}
        onApproveCapture={async (orderId: string) => {
          const res = await fetch(`${API_BASE_URL}/api/paypal/capture-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId })
          });
          if (!res.ok) throw new Error(await res.text());
          const capture = await res.json();
          onSuccess(capture);
        }}
      />
    </div>
  );
}
