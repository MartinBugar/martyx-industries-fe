'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/context/useCart';
import { useAuth } from '@/context/useAuth';
import PayPalCheckoutButton from '@/components/PayPalCheckoutButton';
import styles from './Checkout.module.css';
// import PayPalCheckoutButton from '@/components/PayPalCheckoutButton';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  // Billing Address fields
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;
}

export default function Checkout() {
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
    // Initialize billing address fields
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: ''
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
    setPayStatus("success");
    // Handle success logic here
  };

  const handlePayPalError = (error: unknown) => {
    console.error('PayPal payment error:', error);
    setPayStatus("error");
  };

  // If redirected from PayPal with payment params, show processing instead of empty cart
  if (searchParams.get('paymentId')) {
    return (
      <main className={styles.checkoutContainer} role="main" aria-labelledby="checkout-title">
        <div className={styles.emptyCartMessage}>
          <h2>Finalizing your payment…</h2>
          <p>Redirecting to payment summary.</p>
        </div>
      </main>
    );
  }

  // If cart is empty, redirect to products
  if (items.length === 0) {
    return (
      <main className={styles.checkoutContainer} role="main" aria-labelledby="checkout-title">
        <div className={styles.emptyCartMessage}>
          <h2 id="checkout-title">Your cart is empty</h2>
          <p>Add some products to your cart before proceeding to checkout.</p>
          <button 
            className={styles.continueShoppingBtn}
            onClick={() => router.push('/products')}
          >
            Continue Shopping
          </button>
        </div>
      </main>
    );
  }

  const subtotal = getTotalPrice();
  const hasPhysicalProducts = items.some(i => i.product.productType === 'PHYSICAL');
  const shipping = hasPhysicalProducts ? 5.99 : 0;
  const total = subtotal + shipping;

  return (
    <main className={styles.checkoutContainer} role="main" aria-labelledby="checkout-title">
      <div className={styles.container}>
        <div className={styles.checkoutGrid}>
          {/* Order Summary */}
          <div className={styles.orderSummary}>
            <h2>{t('checkout.order_summary', 'Order Summary')}</h2>
            
            <div className={styles.orderItems}>
              {items.map((item) => (
                <div key={item.product.id} className={styles.orderItem}>
                  <div className={styles.itemImage}>
                    <img 
                      src={item.product.gallery?.[0] || '/assets/kit-01.png'} 
                      alt={item.product.name}
                      loading="lazy"
                    />
                  </div>
                  <div className={styles.itemDetails}>
                    <h4>{item.product.name}</h4>
                    <p className={styles.itemType}>
                      {item.product.productType === 'DIGITAL' ? t('common.digital', 'Digital') : t('common.physical', 'Physical')}
                    </p>
                    <div className={styles.itemQuantity}>
                      {t('checkout.quantity', 'Qty')}: {item.quantity}
                    </div>
                  </div>
                  <div className={styles.itemPrice}>
                    €{(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.orderTotals}>
              <div className={styles.totalRow}>
                <span>{t('checkout.subtotal', 'Subtotal')}</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              {hasPhysicalProducts && (
                <div className={styles.totalRow}>
                  <span>{t('checkout.shipping', 'Shipping')}</span>
                  <span>€{shipping.toFixed(2)}</span>
                </div>
              )}
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>{t('checkout.total', 'Total')}</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className={styles.checkoutForm}>
            <h1 id="checkout-title">{t('checkout.title', 'Checkout')}</h1>

            <form className={styles.form}>
              {/* Customer Information */}
              <section className={styles.formSection}>
                <h3>{t('checkout.customer_info', 'Customer Information')}</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="firstName">{t('checkout.first_name', 'First Name')}</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="lastName">{t('checkout.last_name', 'Last Name')}</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="email">{t('checkout.email', 'Email')}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Billing Address */}
              <section className={styles.formSection}>
                <h3>{t('checkout.billing_address', 'Billing Address')}</h3>
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="billingStreet">{t('checkout.street_address', 'Street Address')}</label>
                    <input
                      type="text"
                      id="billingStreet"
                      name="billingStreet"
                      value={formData.billingStreet}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="billingCity">{t('checkout.city', 'City')}</label>
                    <input
                      type="text"
                      id="billingCity"
                      name="billingCity"
                      value={formData.billingCity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="billingState">{t('checkout.state', 'State/Province')}</label>
                    <input
                      type="text"
                      id="billingState"
                      name="billingState"
                      value={formData.billingState}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="billingPostalCode">{t('checkout.postal_code', 'Postal Code')}</label>
                    <input
                      type="text"
                      id="billingPostalCode"
                      name="billingPostalCode"
                      value={formData.billingPostalCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="billingCountry">{t('checkout.country', 'Country')}</label>
                    <input
                      type="text"
                      id="billingCountry"
                      name="billingCountry"
                      value={formData.billingCountry}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className={styles.formSection}>
                <h3>{t('checkout.payment_method', 'Payment Method')}</h3>
                
                {/* PayPal Button */}
                <div className={styles.paypalSection}>
                  <p>{t('checkout.paypal_description', 'Pay securely with PayPal')}</p>
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

                <div className={styles.paymentDivider}>
                  <span>{t('checkout.or', 'OR')}</span>
                </div>

                {/* Credit Card Form */}
                <div className={styles.cardSection}>
                  <div className={styles.formGrid}>
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label htmlFor="cardNumber">{t('checkout.card_number', 'Card Number')}</label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="cardExpiry">{t('checkout.expiry_date', 'Expiry Date')}</label>
                      <input
                        type="text"
                        id="cardExpiry"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="cardCvc">{t('checkout.cvc', 'CVC')}</label>
                      <input
                        type="text"
                        id="cardCvc"
                        name="cardCvc"
                        value={formData.cardCvc}
                        onChange={handleInputChange}
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Submit Button */}
              <div className={styles.submitSection}>
                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={payStatus === "processing"}
                >
                  {payStatus === "processing" 
                    ? t('checkout.processing', 'Processing...') 
                    : t('checkout.place_order', 'Place Order')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
