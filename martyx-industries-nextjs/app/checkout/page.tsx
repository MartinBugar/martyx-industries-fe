'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/context/useCart';
import { useAuth } from '@/context/useAuth';
import './Checkout.css';
import PayPalCheckoutButton from '@/components/PayPalCheckoutButton';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;
}

export default function CheckoutPage() {
  const { t } = useTranslation('checkout');
  const { items, getTotalPrice } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [payStatus, setPayStatus] = useState<"idle"|"processing"|"success"|"error">("idle");
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: ''
  });

  const cartHash = useMemo(() => {
    const totalCents = Math.round(getTotalPrice() * 100);
    return `${totalCents}:${items.length}`;
  }, [getTotalPrice, items.length]);

  const derivedCurrency = useMemo(() => {
    const currencies = items
      .map(i => i.product?.currency)
      .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      .map(c => c.toUpperCase());
    if (currencies.length === 0) return 'EUR';
    const first = currencies[0];
    return first;
  }, [items]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePayPalSuccess = (capture: any) => {
    console.log('Payment capture response:', capture);

    if (formData.email) {
      sessionStorage.setItem('customerEmail', formData.email);
      localStorage.setItem('customerEmail', formData.email);
    }

    setPayStatus('success');
    router.push('/payment/paypal/success');
  };

  const handlePayPalError = (err: unknown) => {
    console.error('PayPal payment error:', err);
    setPayStatus("error");
    alert(t('payment.failed'));
  };

  if (searchParams.get('paymentId')) {
    return (
      <main className="checkout-container">
        <div className="empty-cart-message">
          <h2>Finalizing your payment…</h2>
          <p>Redirecting to payment summary.</p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="checkout-container">
        <div className="empty-cart-message">
          <h2>Your cart is empty</h2>
          <p>Add some products to your cart before proceeding to checkout.</p>
          <button className="continue-shopping-btn" onClick={() => router.push('/products')}>
            Continue Shopping
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-container">
      <div className="checkout-header">
        <h1>Secure Checkout</h1>
        <p className="checkout-subtitle">Complete your order securely with PayPal</p>
      </div>

      <div className="checkout-content">
        <div className="order-summary-card">
          <div className="card-header">
            <h2>Order Summary</h2>
            <span className="item-count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="order-items">
            {items.map(item => {
              const unit = Number(item.product.price);
              const qty = Number(item.quantity);
              const lineTotal = (unit * qty).toFixed(2);
              return (
                <div key={item.product.id} className="order-item">
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

          <div className="order-breakdown">
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
                  <input type="text" id="firstName" name="firstName" autoComplete="given-name"
                         value={formData.firstName} onChange={handleInputChange} required
                         placeholder="Enter your first name" />
                </div>
                <div className="form-field">
                  <label htmlFor="lastName">Last Name</label>
                  <input type="text" id="lastName" name="lastName" autoComplete="family-name"
                         value={formData.lastName} onChange={handleInputChange} required
                         placeholder="Enter your last name" />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" name="email" autoComplete="email"
                       value={formData.email} onChange={handleInputChange} required
                       placeholder="your.email@example.com" />
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Billing Address</h3>
              <p className="section-subtitle">This information will be used for your invoice</p>
              <div className="form-field">
                <label htmlFor="billingStreet">Street Address</label>
                <input type="text" id="billingStreet" name="billingStreet" autoComplete="street-address"
                       value={formData.billingStreet} onChange={handleInputChange} required
                       placeholder="Enter your street address" />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="billingCity">City</label>
                  <input type="text" id="billingCity" name="billingCity" autoComplete="address-level2"
                         value={formData.billingCity} onChange={handleInputChange} required
                         placeholder="Enter your city" />
                </div>
                <div className="form-field">
                  <label htmlFor="billingState">State/Province</label>
                  <input type="text" id="billingState" name="billingState" autoComplete="address-level1"
                         value={formData.billingState} onChange={handleInputChange} required
                         placeholder="Enter your state" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="billingPostalCode">Postal Code</label>
                  <input type="text" id="billingPostalCode" name="billingPostalCode" autoComplete="postal-code"
                         value={formData.billingPostalCode} onChange={handleInputChange} required
                         placeholder="Enter postal code" />
                </div>
                <div className="form-field">
                  <label htmlFor="billingCountry">Country</label>
                  <input type="text" id="billingCountry" name="billingCountry" autoComplete="country-name"
                         value={formData.billingCountry} onChange={handleInputChange} required
                         placeholder="Enter your country" />
                </div>
              </div>
            </div>

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
                    firstName={formData.firstName}
                    lastName={formData.lastName}
                    cartHash={cartHash}
                    billingAddress={{
                      street: formData.billingStreet,
                      city: formData.billingCity,
                      state: formData.billingState,
                      postalCode: formData.billingPostalCode,
                      country: formData.billingCountry
                    }}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                  />
                </div>
                <p className="payment-note">
                  Pay securely with PayPal. You can use your PayPal account or pay with a credit/debit card.
                </p>
              </div>
            </div>

            {payStatus !== "idle" && (
              <div className={`payment-status status-${payStatus}`}>
                {payStatus === "processing" && (
                  <div className="status-content">
                    <div className="status-icon">⏳</div>
                    <span>{t('payment.processing')}</span>
                  </div>
                )}
                {payStatus === "success" && (
                  <div className="status-content">
                    <div className="status-icon">✅</div>
                    <span>{t('payment.success')}</span>
                  </div>
                )}
                {payStatus === "error" && (
                  <div className="status-content">
                    <div className="status-icon">❌</div>
                    <span>{t('payment.error')}</span>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
