import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { paymentService, type PaymentDTO } from '../../services/paymentService';
import { orderService } from '../../services/orderService';
import { ordersService } from '../../services/ordersService';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';
import { extractPerProductLinks, extractAllProductsUrl } from '../../helpers/downloads';
import type { ProductLink } from '../../helpers/downloads';
import './PayPalSuccess.css';
import { DownloadDropdown } from '../../components/DownloadDropdown';

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function deepOmitTokens<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => deepOmitTokens(v)) as unknown as T;
  }
  if (isObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (/token/i.test(k)) continue;
      result[k] = deepOmitTokens(v);
    }
    return result as unknown as T;
  }
  return value;
}

function formatAmount(val: number | string | undefined): string {
  if (typeof val === 'number') return Number.isFinite(val) ? val.toFixed(2) : '-';
  if (typeof val === 'string') {
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(2) : val;
  }
  return '-';
}



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
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const processedRef = useRef(false);
  const [rawCapture, setRawCapture] = useState<unknown | null>(null);
  const [productLinks, setProductLinks] = useState<ProductLink[]>([]);
  const [allProductsUrl, setAllProductsUrl] = useState<string | null>(null);
  const paymentIdRef = useRef<string | null>(null);

  // Fetch canonical payment details and hydrate structured download links
  const fetchCanonicalDetails = async (base: PaymentDTO) => {
    const ref =
      base.paymentReference ??
      (base.orderId != null ? String(base.orderId) : null) ??
      (base.id != null ? String(base.id) : null);

    let latest = base;
    if (ref) {
      try {
        latest = await paymentService.getPaymentDetails(ref);
      } catch (e) {
        console.debug('[PayPalSuccess] getPaymentDetails failed, using capture payload', e);
      }
    }

    setPayment(latest);

    // Prefer structured links from the canonical response, but if it lacks
    // meaningful product names, fall back to the initial (base) payload
    // which may contain richer "downloadLinks" with productName.
    const builtLatest = extractPerProductLinks(latest);
    let built = builtLatest;
    if (
      builtLatest.length === 0 ||
      builtLatest.every(pl => !pl.productName || /^product(\s+\d+)?$/i.test(pl.productName))
    ) {
      const builtBase = extractPerProductLinks(base);
      if (builtBase.length > 0) {
        built = builtBase;
      }
    }
    setProductLinks(built);

    const allUrl = extractAllProductsUrl(latest) ?? extractAllProductsUrl(base);
    setAllProductsUrl(allUrl);

    console.debug('[PayPalSuccess] structured links', built);

    // (Optional legacy storage for other pages – do not use to render per-product buttons)
    sessionStorage.removeItem('downloadUrls');
    sessionStorage.removeItem('invoiceDownloadUrls');

    const legacyProductUrls: string[] = [];
    if (Array.isArray(latest.downloadUrls)) legacyProductUrls.push(...latest.downloadUrls.filter(Boolean));
    if (typeof latest.downloadUrl === 'string' && latest.downloadUrl) legacyProductUrls.push(latest.downloadUrl);
    if (legacyProductUrls.length > 0) {
      sessionStorage.setItem('downloadUrls', JSON.stringify(legacyProductUrls));
      setDownloadUrls(legacyProductUrls);
    } else {
      setDownloadUrls([]);
    }

    const legacyInvoiceUrls: string[] = [];
    if (Array.isArray(latest.invoiceDownloadUrls)) legacyInvoiceUrls.push(...latest.invoiceDownloadUrls.filter(Boolean));
    if (typeof latest.invoiceDownloadUrl === 'string' && latest.invoiceDownloadUrl) legacyInvoiceUrls.push(latest.invoiceDownloadUrl);
    if (legacyInvoiceUrls.length > 0) {
      sessionStorage.setItem('invoiceDownloadUrls', JSON.stringify(legacyInvoiceUrls));
      setInvoiceDownloadUrls(legacyInvoiceUrls);
    } else {
      setInvoiceDownloadUrls([]);
    }

    if ((built.length === 0) && ref) {
      setTimeout(async () => {
        try {
          const refreshed = await paymentService.getPaymentDetails(ref);
          const againLatest = extractPerProductLinks(refreshed);
          let again = againLatest;
          if (
            againLatest.length === 0 ||
            againLatest.every(pl => !pl.productName || /^product(\s+\d+)?$/i.test(pl.productName))
          ) {
            const baseLinks = extractPerProductLinks(base);
            if (baseLinks.length > 0) {
              again = baseLinks;
            }
          }
          setPayment(refreshed);
          setProductLinks(again);
          const allUrlRef = extractAllProductsUrl(refreshed) ?? extractAllProductsUrl(base);
          setAllProductsUrl(allUrlRef);
        } catch (err) {
          console.debug('[PayPalSuccess] retry getPaymentDetails failed', err);
        }
      }, 1500);
    }
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('paypalCaptureRaw');
      if (raw) setRawCapture(JSON.parse(raw));
    } catch (e) {
      console.debug('[PayPalSuccess] Failed to parse raw capture from sessionStorage', e);
    }
  }, []);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;
    const run = async () => {
      const paymentId = searchParams.get('paymentId');
      paymentIdRef.current = paymentId;
      const payerEmail =
        searchParams.get('PayerEmail') ||
        sessionStorage.getItem('customerEmail') ||
        localStorage.getItem('customerEmail') ||
        '';

      // Telemetry: log current sessionStorage state at page load
      console.debug('[PayPalSuccess] Page load debug', {
        existingDownloadUrls: downloadUrls,
        existingInvoiceDownloadUrls: invoiceDownloadUrls,
        paymentId,
      });


      // If we received payment details via navigation state, use them directly
      const statePayment = locationState?.payment;
      if (statePayment) {
        try {
          console.debug('[PayPalSuccess] Payment from navigation state', {
            status: statePayment.status,
            orderId: statePayment.orderId,
          });

          if (statePayment.status === 'COMPLETED') {
            // Store email used
            if (statePayment.payerEmail || payerEmail) {
              sessionStorage.setItem('customerEmail', statePayment.payerEmail || payerEmail);
            }

            await fetchCanonicalDetails(statePayment);

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
          } else {
            setShowStatusModal(true);
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
        console.debug('[PayPalSuccess] Payment from server response', {
          status: res.status,
          orderId: res.orderId,
        });

        if (res.status === 'COMPLETED') {
          // Store email used
          if (res.payerEmail || payerEmail) {
            sessionStorage.setItem('customerEmail', res.payerEmail || payerEmail);
          }

          await fetchCanonicalDetails(res);

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
        } else {
          setShowStatusModal(true);
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
      console.debug('[DownloadInvoice] Not firing request: payment not completed', { status: current?.status });
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
        console.debug('[DownloadInvoice] No invoiceDownloadUrls and no orderId, not firing request', {
          paymentStatus: current.status,
          orderId: current.orderId,
          invoiceUrlsCount: invoiceDownloadUrls?.length || 0,
        });
        return;
      }
    } catch (e) {
      const msg = 'Failed to download invoice. Please try again later or check your email.';
      console.debug('[DownloadInvoice] Fetch failed', e);
      setDlError(msg);
    } finally {
      setDownloading(false);
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
    <div className="page-container" aria-hidden={showStatusModal}>
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
                <p className="order-message" style={{ opacity: 0.85 }}>Note: links may take a moment to appear while we generate your files.</p>
              </>
            ) : payment.status === 'PENDING' ? (
              <p className="order-message">Your payment is pending. You will receive an email once it is completed.</p>
            ) : (
              <p className="order-message">Payment was not successful. {payment.errorMessage ? `Reason: ${payment.errorMessage}` : ''}</p>
            )}

            <div className="summary-grid" aria-label="Order summary">
              <div className="summary-item">
                <span className="label">Price</span>
                <span className="value">{formatAmount(payment.amount)} {payment.currency || ''}</span>
              </div>
              <div className="summary-item">
                <span className="label">Method</span>
                <span className="value">{payment.paymentMethod || 'PAYPAL'}</span>
              </div>
              <div className="summary-item">
                <span className="label">Order ID</span>
                <span className="value">{payment.orderNumber ?? payment.orderId ?? '-'}</span>
              </div>
            </div>

            <div className="detail-grid" aria-label="Payment details">
              <dl>
                <dt>Transaction ID</dt>
                <dd>{payment.transactionId || '-'}</dd>
                <dt>Payer Email</dt>
                <dd>{payment.payerEmail || '-'}</dd>
              </dl>
            </div>

            <div className="actions">
              {payment.status === 'COMPLETED' ? (
                <>
                  {productLinks && productLinks.length > 0 ? (
                    <DownloadDropdown
                      links={productLinks}
                      allUrl={allProductsUrl ?? extractAllProductsUrl(payment)}
                      onError={(msg) => setDlError(msg)}
                    />
                  ) : (
                    <div className="download-note">Loading download links…</div>
                  )}

                  <button onClick={async () => {
                    console.log('[analytics] invoice click');
                    await handleDownloadInvoice();
                  }} disabled={downloading || !((invoiceDownloadUrls && invoiceDownloadUrls.length > 0) || !!payment.orderId)}>
                    {downloading ? 'Downloading…' : 'Download invoice (PDF)'}
                  </button>

                  <button onClick={async () => {
                    if (!payment) return;
                    await fetchCanonicalDetails(payment);
                  }}>
                    Refresh links
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

            {payment.status === 'COMPLETED' && rawCapture != null && (
              <div className="capture-section" aria-label="Capture response">
                <div className="order-header" style={{ marginTop: 16 }}>
                  <h3>Payment Response (Capture)</h3>
                </div>
                <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', maxHeight: 400 }} aria-label="PayPal capture response">
{JSON.stringify(deepOmitTokens(rawCapture), null, 2)}
                </pre>
              </div>
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

      {showStatusModal && payment && payment.status !== 'COMPLETED' && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="status-modal-title">
          <div className="modal-card">
            <div className="order-header">
              <h3 id="status-modal-title">Payment Status</h3>
              <span className={`status-badge status-${payment.status?.toLowerCase()}`}>{payment.status ?? 'UNKNOWN'}</span>
            </div>
            {payment.status === 'PENDING' ? (
              <p className="order-message">Your payment is pending. You will receive an email once it is completed.</p>
            ) : (
              <p className="order-message">Payment was not completed. {payment.errorMessage ? `Reason: ${payment.errorMessage}` : ''}</p>
            )}
            <div className="actions">
              <button onClick={() => setShowStatusModal(false)}>Close</button>
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


