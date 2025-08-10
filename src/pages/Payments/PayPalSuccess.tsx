import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { paymentService, type PaymentDTO } from '../../services/paymentService';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';

const PayPalSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, addOrder, updateProfile } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const location = useLocation();
  const locationState = location.state as { payment?: PaymentDTO } | null;
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [payment, setPayment] = useState<PaymentDTO | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;
    const run = async () => {
      const paymentId = searchParams.get('paymentId');
      const payerEmail =
        searchParams.get('PayerEmail') ||
        sessionStorage.getItem('customerEmail') ||
        localStorage.getItem('customerEmail') ||
        '';

      // If we received payment details via navigation state, use them directly
      const statePayment = locationState?.payment;
      if (statePayment) {
        try {
          setPayment(statePayment);

          if (statePayment.status === 'COMPLETED') {
            // Store email used
            if (statePayment.payerEmail || payerEmail) {
              sessionStorage.setItem('customerEmail', statePayment.payerEmail || payerEmail);
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

            // Clear cart on success
            clearCart();
          } else if (statePayment.status !== 'PENDING') {
            setError(statePayment.errorMessage || 'Payment not completed');
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Failed to finalize payment';
          setError(msg);
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      if (!paymentId) {
        setError('Missing paymentId');
        setIsProcessing(false);
        return;
      }

      try {
        const res = await paymentService.executePayPalPayment(paymentId, payerEmail);
        setPayment(res);

        if (res.status === 'COMPLETED') {
          // Store email used
          if (res.payerEmail || payerEmail) {
            sessionStorage.setItem('customerEmail', res.payerEmail || payerEmail);
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

          // Clear cart on success
          clearCart();
        } else if (res.status !== 'PENDING') {
          setError(res.errorMessage || 'Payment not completed');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to finalize payment';
        setError(msg);
      } finally {
        setIsProcessing(false);
      }
    };
    run();
  }, []);

  if (isProcessing) {
    return <div className="page-container"><p>Finalizing your payment…</p></div>;
  }

  if (error && !payment) {
    return (
      <div className="page-container">
        <h2>Payment Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/checkout')}>Back to Checkout</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2>Payment Summary</h2>
      {payment ? (
        <div className="payment-summary">
          <div className={`status-badge status-${payment.status?.toLowerCase()}`}>
            {payment.status}
          </div>

          {payment.status === 'COMPLETED' ? (
            <p>Your payment has been successfully completed.</p>
          ) : payment.status === 'PENDING' ? (
            <p>Your payment is pending. You will receive an email once it is completed.</p>
          ) : (
            <p>Payment was not successful. {payment.errorMessage ? `Reason: ${payment.errorMessage}` : ''}</p>
          )}

          <div className="payment-details">
            <div><strong>Reference:</strong> {payment.paymentReference || '-'}</div>
            <div><strong>Transaction ID:</strong> {payment.transactionId || '-'}</div>
            <div><strong>Order ID:</strong> {payment.orderId ?? '-'}</div>
            <div><strong>Amount:</strong> {payment.amount?.toFixed(2)} {payment.currency || ''}</div>
            <div><strong>Method:</strong> {payment.paymentMethod || 'PAYPAL'}</div>
            <div><strong>Payer Email:</strong> {payment.payerEmail || '-'}</div>
            <div><strong>Created At:</strong> {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'}</div>
            <div><strong>Completed At:</strong> {payment.completedAt ? new Date(payment.completedAt).toLocaleString() : '-'}</div>
          </div>

          <div className="actions" style={{ marginTop: '16px' }}>
            {payment.status === 'COMPLETED' ? (
              <button onClick={() => navigate('/order-confirmation')}>Continue</button>
            ) : (
              <button onClick={() => navigate('/checkout')}>Back to Checkout</button>
            )}
            <button style={{ marginLeft: 8 }} onClick={() => navigate('/')}>Go to Home</button>
          </div>
        </div>
      ) : (
        <div className="payment-summary">
          <p>Could not retrieve payment details.</p>
          <div className="actions" style={{ marginTop: '16px' }}>
            <button onClick={() => navigate('/checkout')}>Back to Checkout</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayPalSuccess;


