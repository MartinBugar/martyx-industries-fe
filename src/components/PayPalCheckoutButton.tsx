import { useCallback, useMemo } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import type { CartItem } from "../context/cartContextTypes";
import { API_BASE_URL } from "../services/apiUtils";

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

  return (
    <PayPalButtons
      style={{ 
        layout: "vertical", 
        shape: "rect", 
        label: "pay",
        color: "blue",
        height: 48,
        tagline: false
      }}
      createOrder={createOrder}
      onApprove={onApprove}
      onError={onError}
      forceReRender={forceReRender}
      // Optional: disable/enable based on cart validity
      // disabled={!cartIsValid}
    />
  );
}
