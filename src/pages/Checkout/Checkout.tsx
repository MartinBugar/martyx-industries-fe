import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import './Checkout.css';
import PayPalCheckoutButton from '../../components/PayPalCheckoutButton';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
}

const Checkout: React.FC = () => {
  const { items, getTotalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payStatus, setPayStatus] = useState<"idle"|"processing"|"success"|"error">("idle");
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: ''
  });

  // Compute cartHash that changes when cart total or items change
  const cartHash = useMemo(() => {
    const totalCents = Math.round(getTotalPrice() * 100);
    return `${totalCents}:${items.length}`;
  }, [getTotalPrice, items.length]);

  // Derive currency from cart items (from product data). Fallback to EUR if not available.
  const derivedCurrency = useMemo(() => {
    const currencies = items
      .map(i => i.product?.currency)
      .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      .map(c => c.toUpperCase());
    if (currencies.length === 0) return 'EUR';
    const first = currencies[0];
    const mixed = !currencies.every(c => c === first);
    if (mixed) {
      console.warn('[Checkout] Mixed currencies detected in cart items:', currencies);
    }
    return first;
  }, [items]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // PayPal success handler
  const handlePayPalSuccess = (capture: unknown) => {
    console.log('Payment capture response:', capture);

    // Normalize capture data into a flexible shape and check backend status
    type PayPalCaptureLoose = {
      id?: string;
      transactionId?: string;
      amount?: number;
      orderId?: number | string;
      payerEmail?: string;
      payer?: { email_address?: string };
      purchase_units?: Array<{
        amount?: { currency_code?: string; value?: string };
        payments?: { captures?: Array<{ id?: string }> };
      }>;
      currency?: string;
      order?: { id?: number | string };
      // New fields from backend capture-order response
      status?: string; // expects "PAID" for success
      orderNumber?: string;
      downloadUrl?: string;
      downloadUrls?: string[];
      downloadToken?: string;
      downloadTokens?: string[];
      downloadLinks?: Array<{
        productId?: string | number;
        productName?: string;
        downloadUrl?: string;
        downloadToken?: string;
      }>;
      orderItems?: Array<{
        productId?: string | number;
        productName?: string;
        quantity?: number;
        price?: number;
        downloadUrl?: string;
        downloadToken?: string;
      }>;
      invoiceDownloadUrl?: string;
      invoiceDownloadUrls?: string[];
      invoiceDownloadToken?: string;
      invoiceDownloadTokens?: string[];
    };

    const c = capture as PayPalCaptureLoose;
    const backendStatus = (c?.status || '').toString().toUpperCase();

    // Accept both PAID and COMPLETED as successful statuses from backend
    if (backendStatus !== 'PAID' && backendStatus !== 'COMPLETED') {
      console.error('Capture not successful, aborting success navigation. Status:', c?.status);
      setPayStatus('error');
      alert('Payment not completed. Please try again or contact support.');
      return;
    }

    // Persist email for later use (on success only)
    if (formData.email) {
      sessionStorage.setItem('customerEmail', formData.email);
      localStorage.setItem('customerEmail', formData.email);
    }

    const txId = c?.transactionId || c?.id || c?.purchase_units?.[0]?.payments?.captures?.[0]?.id || undefined;
    const payerEmail = c?.payer?.email_address || c?.payerEmail || formData.email || undefined;
    const orderId = c?.orderId ?? c?.order?.id ?? undefined;
    const currency = (c?.currency || c?.purchase_units?.[0]?.amount?.currency_code || 'EUR') as string;
    const amount = typeof c?.amount === 'number' ? c.amount : Number(c?.purchase_units?.[0]?.amount?.value) || getTotalPrice();

    const paymentState = {
      status: 'COMPLETED', // map backend PAID -> UI COMPLETED
      amount,
      currency,
      paymentMethod: 'PAYPAL',
      transactionId: txId,
      payerEmail,
      orderId,
      orderNumber: c?.orderNumber,
      // pass-through any optional download info if backend provided it
      downloadUrl: c?.downloadUrl,
      downloadUrls: Array.isArray(c?.downloadUrls) ? c.downloadUrls : undefined,
      downloadToken: c?.downloadToken,
      downloadTokens: Array.isArray(c?.downloadTokens) ? c.downloadTokens : undefined,
      // Include structured download links and order items
      downloadLinks: Array.isArray(c?.downloadLinks) ? c.downloadLinks : undefined,
      orderItems: Array.isArray(c?.orderItems) ? c.orderItems : undefined,
      invoiceDownloadUrl: c?.invoiceDownloadUrl,
      invoiceDownloadUrls: Array.isArray(c?.invoiceDownloadUrls) ? c.invoiceDownloadUrls : undefined,
      invoiceDownloadToken: c?.invoiceDownloadToken,
      invoiceDownloadTokens: Array.isArray(c?.invoiceDownloadTokens) ? c.invoiceDownloadTokens : undefined,
    } as const;

    try {
      sessionStorage.setItem('paypalCaptureRaw', JSON.stringify(capture));
    } catch (err) {
      console.warn('[Checkout] Failed to persist raw PayPal capture response', err);
    }

    setPayStatus('success');

    // Navigate to the dedicated PayPal success page with normalized payment data
    navigate('/payment/paypal/success', { state: { payment: paymentState } });
  };

  // PayPal error handler
  const handlePayPalError = (err: unknown) => {
    console.error('PayPal payment error:', err);
    setPayStatus("error");
    alert('Payment failed. Please try again.');
  };
  
  // If redirected from PayPal with payment params, show processing instead of empty cart
  if (searchParams.get('paymentId')) {
    return (
      <main className="checkout-container" role="main" aria-labelledby="checkout-title">
        <div className="empty-cart-message">
          <h2>Finalizing your payment…</h2>
          <p>Redirecting to payment summary.</p>
        </div>
      </main>
    );
  }
  
  // If cart is empty, redirect to products
  if (items.length === 0) {
    return (
      <main className="checkout-container" role="main" aria-labelledby="checkout-title">
        <div className="empty-cart-message">
          <h2 id="checkout-title">Your cart is empty</h2>
          <p>Add some products to your cart before proceeding to checkout.</p>
          <button 
            className="continue-shopping-btn"
            onClick={() => navigate('/products')}
          >
            Continue Shopping
          </button>
        </div>
      </main>
    );
  }
  
  return (
    <main className="checkout-container" role="main" aria-labelledby="checkout-title">
      <div className="checkout-header">
        <h1 id="checkout-title">Secure Checkout</h1>
        <p className="checkout-subtitle">Complete your order securely with PayPal</p>
      </div>
      
      <div className="checkout-content">
        {/* Order Summary */}
        <div className="order-summary-card" role="region" aria-labelledby="order-summary-title">
          <div className="card-header">
            <h2 id="order-summary-title">Order Summary</h2>
            <span className="item-count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="order-items" role="list">
            {items.map(item => {
              const unit = Number(item.product.price);
              const qty = Number(item.quantity);
              const lineTotal = (unit * qty).toFixed(2);
              return (
                <div
                  key={item.product.id}
                  className="order-item"
                  role="listitem"
                  aria-label={`${item.product.name}, quantity ${qty}, total €${lineTotal}`}
                >
                  <div className="item-content">
                    <div className="item-name">{item.product.name}</div>
                    <div className="item-details">
                      <span className="item-meta">€{unit.toFixed(2)} × {qty}</span>
                    </div>
                  </div>
                  <div className="item-amount">€{lineTotal}</div>
                </div>
              );
            })}
          </div>
          
          <div className="order-breakdown" aria-live="polite">
            <div className="breakdown-row">
              <span>Subtotal</span>
              <span>€{getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="breakdown-row">
              <span>Processing fees</span>
              <span>€0.00</span>
            </div>
            <div className="breakdown-divider"></div>
            <div className="order-total">
              <span>Total</span>
              <span>€{getTotalPrice().toFixed(2)}</span>
            </div>
          </div>
          
          <div className="delivery-badge">
            <div className="badge-icon">📧</div>
            <div className="badge-content">
              <strong>Instant Digital Delivery</strong>
              <p>Products delivered to your email immediately after payment</p>
            </div>
          </div>
        </div>
        
        {/* Checkout Form */}
        <div className="checkout-form-card">
          <div className="card-header">
            <h2>Contact Information</h2>
            <p className="form-subtitle">We'll send your digital products to this email address</p>
          </div>
          
          <form className="checkout-form">
            <div className="form-section">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div className="form-field">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
            
            {/* Payment Section */}
            <div className="payment-section">
              <div className="payment-header">
                <h3>Payment Method</h3>
                <div className="security-badge">
                  <span className="security-icon">🔒</span>
                  <span>Secure Payment</span>
                </div>
              </div>
              
              <div className="payment-method-card">
                <div className="paypal-container">
                  <PayPalCheckoutButton
                    items={items}
                    totalAmount={getTotalPrice()}
                    currency={derivedCurrency}
                    email={formData.email}
                    cartHash={cartHash}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                  />
                </div>
                <p className="payment-note">
                  Pay securely with PayPal. You can use your PayPal account or pay with a credit/debit card.
                </p>
              </div>
            </div>
            
            {/* Status messages */}
            {payStatus !== "idle" && (
              <div className={`payment-status status-${payStatus}`} role="status" aria-live="polite" aria-atomic="true">
                {payStatus === "processing" && (
                  <div className="status-content">
                    <div className="status-icon">⏳</div>
                    <span>Processing your payment...</span>
                  </div>
                )}
                {payStatus === "success" && (
                  <div className="status-content">
                    <div className="status-icon">✅</div>
                    <span>Payment completed successfully!</span>
                  </div>
                )}
                {payStatus === "error" && (
                  <div className="status-content">
                    <div className="status-icon">❌</div>
                    <span>Payment failed. Please try again.</span>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
};

export default Checkout;