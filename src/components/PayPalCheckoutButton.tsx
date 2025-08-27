import { useCallback, useMemo } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";

type Props = {
  userId: string;
  cartHash: string | number; // changes whenever cart content/total changes
  onSuccess: (capture: any) => void;
  onError: (err: unknown) => void;
};

export default function PayPalCheckoutButton({ userId, cartHash, onSuccess, onError }: Props) {

  // Create order on server
  const createOrder = useCallback(async () => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://martyx-industries-be-2xf3x.ondigitalocean.app'}/api/paypal/create-order`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ userId })
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Create order failed: ${msg}`);
    }

    const data = await res.json();
    if (!data?.id) throw new Error("Server did not return order id.");
    return data.id as string;
  }, [userId]);

  // Capture on server after approval
  const onApprove = useCallback(async (data: { orderID: string }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://martyx-industries-be-2xf3x.ondigitalocean.app'}/api/paypal/capture-order`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
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
  const forceReRender = useMemo(() => [cartHash, "EUR", "capture"], [cartHash]);

  return (
    <PayPalButtons
      style={{ layout: "vertical", shape: "rect", label: "pay" }}
      createOrder={createOrder}
      onApprove={onApprove}
      onError={onError}
      forceReRender={forceReRender}
      // Optional: disable/enable based on cart validity
      // disabled={!cartIsValid}
    />
  );
}
