import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';

const PayPalSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, addOrder, updateProfile } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);

  useEffect(() => {
    const run = async () => {
      const paymentId = searchParams.get('paymentId');
      const payerEmail = searchParams.get('PayerEmail') || sessionStorage.getItem('customerEmail') || '';
      if (!paymentId) {
        setError('Missing paymentId');
        setIsProcessing(false);
        return;
      }

      try {
        const payment = await paymentService.executePayPalPayment(paymentId, payerEmail);

        if (payment.status === 'COMPLETED') {
          // Store email used
          if (payerEmail) {
            sessionStorage.setItem('customerEmail', payerEmail);
          }

          // Save order to user's history if logged in
          if (isAuthenticated && user) {
            addOrder({
              items: items.map((item) => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                price: item.product.price,
              })),
              totalAmount: getTotalPrice(),
              status: 'completed',
            });

            // Optionally update profile name if empty using payer email/name (if available)
            if (!user.firstName || !user.lastName) {
              await updateProfile({});
            }
          }

          // Clear cart and go to confirmation
          clearCart();
          navigate('/order-confirmation', { replace: true });
        } else {
          setError('Payment not completed');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to finalize payment';
        setError(msg);
      } finally {
        setIsProcessing(false);
      }
    };
    run();
  }, [searchParams, navigate, addOrder, clearCart, getTotalPrice, isAuthenticated, updateProfile, user, items]);

  if (isProcessing) {
    return <div className="page-container"><p>Finalizing your payment…</p></div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <h2>Payment Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/checkout')}>Back to Checkout</button>
      </div>
    );
  }

  return null;
};

export default PayPalSuccess;


