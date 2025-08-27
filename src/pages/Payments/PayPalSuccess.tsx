import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { paymentService, type PaymentDTO } from '../../services/paymentService';
import { orderService } from '../../services/orderService';
import { ordersService } from '../../services/ordersService';
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
  const [downloadUrls, setDownloadUrls] = useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem('downloadUrls');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [invoiceDownloadUrls, setInvoiceDownloadUrls] = useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem('invoiceDownloadUrls');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [downloadingProduct, setDownloadingProduct] = useState<boolean>(false);
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

            // Extract download URLs/tokens from response and store for later pages
            const links: string[] = [];
            if (Array.isArray(statePayment.downloadUrls)) links.push(...statePayment.downloadUrls.filter(Boolean));
            if (typeof statePayment.downloadUrl === 'string' && statePayment.downloadUrl) links.push(statePayment.downloadUrl);
            const toUrl = (t: string) => `/api/download/${encodeURIComponent(t)}`;
            if (Array.isArray(statePayment.downloadTokens)) links.push(...statePayment.downloadTokens.filter(Boolean).map(toUrl));
            if (typeof statePayment.downloadToken === 'string' && statePayment.downloadToken) links.push(toUrl(statePayment.downloadToken));
            if (links.length > 0) {
              sessionStorage.setItem('downloadUrls', JSON.stringify(links));
              setDownloadUrls(links);
            }

            // Extract invoice download URLs/tokens and store
            const invLinks: string[] = [];
            if (Array.isArray(statePayment.invoiceDownloadUrls)) invLinks.push(...statePayment.invoiceDownloadUrls.filter(Boolean));
            if (typeof statePayment.invoiceDownloadUrl === 'string' && statePayment.invoiceDownloadUrl) invLinks.push(statePayment.invoiceDownloadUrl);
            const toInvoiceUrl = (t: string) => `/api/download/invoice/${encodeURIComponent(t)}`;
            if (Array.isArray(statePayment.invoiceDownloadTokens)) invLinks.push(...statePayment.invoiceDownloadTokens.filter(Boolean).map(toInvoiceUrl));
            if (typeof statePayment.invoiceDownloadToken === 'string' && statePayment.invoiceDownloadToken) invLinks.push(toInvoiceUrl(statePayment.invoiceDownloadToken));
            if (invLinks.length > 0) {
              sessionStorage.setItem('invoiceDownloadUrls', JSON.stringify(invLinks));
              setInvoiceDownloadUrls(invLinks);
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

          // Extract download URLs/tokens from response and store for later pages
          const links: string[] = [];
          if (Array.isArray(res.downloadUrls)) links.push(...res.downloadUrls.filter(Boolean));
          if (typeof res.downloadUrl === 'string' && res.downloadUrl) links.push(res.downloadUrl);
          const toUrl = (t: string) => `/api/download/${encodeURIComponent(t)}`;
          if (Array.isArray(res.downloadTokens)) links.push(...res.downloadTokens.filter(Boolean).map(toUrl));
          if (typeof res.downloadToken === 'string' && res.downloadToken) links.push(toUrl(res.downloadToken));
          if (links.length > 0) {
            sessionStorage.setItem('downloadUrls', JSON.stringify(links));
            setDownloadUrls(links);
          }

          // Extract invoice download URLs/tokens and store
          const invLinks: string[] = [];
          if (Array.isArray(res.invoiceDownloadUrls)) invLinks.push(...res.invoiceDownloadUrls.filter(Boolean));
          if (typeof res.invoiceDownloadUrl === 'string' && res.invoiceDownloadUrl) invLinks.push(res.invoiceDownloadUrl);
          const toInvoiceUrl = (t: string) => `/api/download/invoice/${encodeURIComponent(t)}`;
          if (Array.isArray(res.invoiceDownloadTokens)) invLinks.push(...res.invoiceDownloadTokens.filter(Boolean).map(toInvoiceUrl));
          if (typeof res.invoiceDownloadToken === 'string' && res.invoiceDownloadToken) invLinks.push(toInvoiceUrl(res.invoiceDownloadToken));
          if (invLinks.length > 0) {
            sessionStorage.setItem('invoiceDownloadUrls', JSON.stringify(invLinks));
            setInvoiceDownloadUrls(invLinks);
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
    if (!current || current.status !== 'COMPLETED') {
      setDlError('Invoice is available only for completed orders.');
      return;
    }
    try {
      setDownloading(true);
      if (invoiceDownloadUrls && invoiceDownloadUrls.length > 0) {
        await ordersService.downloadInvoiceByUrl(invoiceDownloadUrls[0]);
      } else if (current.orderId != null) {
        await orderService.downloadInvoice(current.orderId as number);
      } else {
        setDlError('Invoice link is not available yet.');
        return;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to download invoice';
      setDlError(msg);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadProduct = async () => {
    setDlError(null);
    if (!downloadUrls || downloadUrls.length === 0) {
      setDlError('Download link is not available yet.');
      return;
    }
    try {
      setDownloadingProduct(true);
      await ordersService.downloadByUrl(downloadUrls[0], 'product');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to download product';
      setDlError(msg);
    } finally {
      setDownloadingProduct(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="page-container">
        <div className="order-container">
          <div className="order-card" aria-live="polite" aria-busy={true}>
            <div className="order-header">
              <h2>Processing Payment</h2>
              <span className="status-badge status-pending">PENDING</span>
            </div>
            <p className="order-message">Finalizing your payment…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="page-container">
        <div className="order-container">
          <div className="order-card">
            <div className="order-header">
              <h2>Payment Error</h2>
              <span className="status-badge status-error">ERROR</span>
            </div>
            <p className="order-message">{error}</p>
            <div className="actions">
              <button onClick={() => navigate('/checkout')}>Back to Checkout</button>
              <button onClick={() => navigate('/')}>Go to Home</button>
            </div>
          </div>
        </div>
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
              <>
                <p className="order-message">Order successfully paid.</p>
                <p className="order-message">We have sent an email with your invoice and digital product.</p>
              </>
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
                <span className="value">{(payment as any)?.orderNumber || payment.orderId || '-'}</span>
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
                  <button onClick={handleDownloadProduct} disabled={downloadingProduct}>
                    {downloadingProduct ? 'Downloading…' : 'Download Digital Product'}
                  </button>
                  <button onClick={handleDownloadInvoice} disabled={downloading}>
                    {downloading ? 'Downloading…' : 'Download Invoice'}
                  </button>
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


