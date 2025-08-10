import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { paymentService, type PaymentDTO } from '../../services/paymentService';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';
import './PayPalSuccess.css';

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
  const [dlError, setDlError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
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

  const handleDownloadInvoice = async () => {
    setDlError(null);
    const current = payment;
    if (!current || current.status !== 'COMPLETED' || current.orderId == null) {
      setDlError('Invoice is available only for completed orders.');
      return;
    }
    try {
      setDownloading(true);
      await orderService.downloadInvoice(current.orderId as number);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to download invoice';
      setDlError(msg);
    } finally {
      setDownloading(false);
    }
  };

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
      {payment ? (
        <div className="order-container">
          <div className="order-card" aria-live="polite" aria-busy={isProcessing}>
            <div className="order-header">
              <h2>Order Details</h2>
              <span className={`status-badge status-${payment.status?.toLowerCase()}`}>{payment.status ?? 'UNKNOWN'}</span>
            </div>

            {payment.status === 'COMPLETED' ? (
              <p className="order-message">Your payment has been successfully completed.</p>
            ) : payment.status === 'PENDING' ? (
              <p className="order-message">Your payment is pending. You will receive an email once it is completed.</p>
            ) : (
              <p className="order-message">Payment was not successful. {payment.errorMessage ? `Reason: ${payment.errorMessage}` : ''}</p>
            )}

            <div className="summary-grid" aria-label="Order summary">
              <div className="summary-item">
                <span className="label">Amount</span>
                <span className="value">{payment.amount?.toFixed(2)} {payment.currency || ''}</span>
              </div>
              <div className="summary-item">
                <span className="label">Method</span>
                <span className="value">{payment.paymentMethod || 'PAYPAL'}</span>
              </div>
              <div className="summary-item">
                <span className="label">Order ID</span>
                <span className="value">{payment.orderId ?? '-'}</span>
              </div>
            </div>

            <div className="detail-grid" aria-label="Payment details">
              <dl>
                <dt>Reference</dt>
                <dd>{payment.paymentReference || '-'}</dd>
                <dt>Transaction ID</dt>
                <dd>{payment.transactionId || '-'}</dd>
                <dt>Payer Email</dt>
                <dd>{payment.payerEmail || '-'}</dd>
                <dt>Created At</dt>
                <dd>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'}</dd>
                <dt>Completed At</dt>
                <dd>{payment.completedAt ? new Date(payment.completedAt).toLocaleString() : '-'}</dd>
              </dl>
            </div>

            <div className="actions">
              {payment.status === 'COMPLETED' ? (
                <>
                  {typeof payment.orderId === 'number' && (
                    <button onClick={handleDownloadInvoice} disabled={downloading}>
                      {downloading ? 'Downloading…' : 'Download Invoice'}
                    </button>
                  )}
                  <button onClick={() => navigate('/order-confirmation')}>Continue</button>
                </>
              ) : (
                <button onClick={() => navigate('/checkout')}>Back to Checkout</button>
              )}
              <button onClick={() => navigate('/')}>Go to Home</button>
            </div>
            {dlError && (
              <p className="msg-error">{dlError}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="order-container">
          <div className="order-card">
            <h2>Order Details</h2>
            <p>Could not retrieve payment details.</p>
            <div className="actions">
              <button onClick={() => navigate('/checkout')}>Back to Checkout</button>
              <button onClick={() => navigate('/')}>Go to Home</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayPalSuccess;


