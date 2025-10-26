import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import './Checkout.css';
import PayPalCheckoutButton from '../../components/PayPalCheckoutButton';
import { shippingService } from '../../services/shippingService';
import { discountService } from '../../services/discountService';
import type { ShippingOptionDto } from '../../types/shipping';
import type { DiscountValidationDto } from '../../types/discounts';

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
  // B2B Customer fields
  isCompany: boolean;
  companyName: string;
  companyId: string; // IČO
  taxId: string;     // DIČ
  vatId: string;     // IČ DPH
}

const Checkout: React.FC = () => {
  const { t } = useTranslation('checkout');
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
    cardCvc: '',
    // Initialize billing address fields
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: 'SK', // Default to Slovakia
    // Initialize B2B fields
    isCompany: false,
    companyName: '',
    companyId: '', // IČO
    taxId: '',     // DIČ
    vatId: ''      // IČ DPH
  });

  // Discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [discountValidation, setDiscountValidation] = useState<DiscountValidationDto | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState('');

  // Shipping state
  const [shippingOptions, setShippingOptions] = useState<ShippingOptionDto[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOptionDto | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');

  // Calculate cart weight (assuming 0.5kg per item as default)
  const calculateCartWeight = () => {
    return items.reduce((total, item) => {
      // If product has weight, use it, otherwise default to 0.5kg
      const weight = (item.product as any).weightKg || 0.5;
      return total + (weight * item.quantity);
    }, 0);
  };

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

  // Calculate totals with discount and shipping
  const calculateTotals = () => {
    const subtotal = getTotalPrice();
    const discountAmount = discountValidation?.valid ? (discountValidation.calculated_discount_amount || 0) : 0;
    const shippingCost = selectedShipping?.shipping_cost || 0;
    const total = subtotal - discountAmount + shippingCost;

    return {
      subtotal,
      discount: discountAmount,
      shipping: shippingCost,
      total: Math.max(0, total) // Ensure total is never negative
    };
  };

  // Fetch shipping options when country changes
  useEffect(() => {
    const fetchShippingOptions = async () => {
      if (!formData.billingCountry || formData.billingCountry.trim().length < 2) {
        return;
      }

      setIsLoadingShipping(true);
      setShippingError('');

      try {
        const totals = calculateTotals();
        const response = await shippingService.calculateShipping({
          destination_country_code: formData.billingCountry.toUpperCase(),
          total_weight_kg: calculateCartWeight(),
          order_subtotal: totals.subtotal,
          destination_postal_code: formData.billingPostalCode || undefined
        });

        if (response.available_rates && response.available_rates.length > 0) {
          setShippingOptions(response.available_rates);
          // Auto-select cheapest option
          setSelectedShipping(response.available_rates[0]);
        } else {
          setShippingOptions([]);
          setSelectedShipping(null);
          setShippingError('No shipping options available for this destination');
        }
      } catch (error) {
        console.error('Error fetching shipping options:', error);
        setShippingError('Failed to calculate shipping costs. Please check your address.');
        setShippingOptions([]);
        setSelectedShipping(null);
      } finally {
        setIsLoadingShipping(false);
      }
    };

    fetchShippingOptions();
  }, [formData.billingCountry, formData.billingPostalCode, items]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle discount code validation
  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setIsValidatingDiscount(true);
    setDiscountError('');

    try {
      const totals = calculateTotals();
      const validation = await discountService.validateDiscount(
        discountCode.trim(),
        totals.subtotal,
        user?.id ? Number(user.id) : undefined
      );

      setDiscountValidation(validation);

      if (!validation.valid) {
        setDiscountError(validation.error_message || 'Invalid discount code');
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      setDiscountError('Failed to validate discount code. Please try again.');
      setDiscountValidation(null);
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  // Handle discount code removal
  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setDiscountValidation(null);
    setDiscountError('');
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
      status?: string;
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

    if (backendStatus !== 'PAID' && backendStatus !== 'COMPLETED') {
      console.error('Capture not successful, aborting success navigation. Status:', c?.status);
      setPayStatus('error');
      alert(t('payment.not_completed'));
      return;
    }

    if (formData.email) {
      sessionStorage.setItem('customerEmail', formData.email);
      localStorage.setItem('customerEmail', formData.email);
    }

    const txId = c?.transactionId || c?.id || c?.purchase_units?.[0]?.payments?.captures?.[0]?.id || undefined;
    const payerEmail = c?.payer?.email_address || c?.payerEmail || formData.email || undefined;
    const orderId = c?.orderId ?? c?.order?.id ?? undefined;
    const currency = (c?.currency || c?.purchase_units?.[0]?.amount?.currency_code || 'EUR') as string;
    const totals = calculateTotals();
    const amount = typeof c?.amount === 'number' ? c.amount : Number(c?.purchase_units?.[0]?.amount?.value) || totals.total;

    const paymentState = {
      status: 'COMPLETED',
      amount,
      currency,
      paymentMethod: 'PAYPAL',
      transactionId: txId,
      payerEmail,
      orderId,
      orderNumber: c?.orderNumber,
      downloadUrl: c?.downloadUrl,
      downloadUrls: Array.isArray(c?.downloadUrls) ? c.downloadUrls : undefined,
      downloadToken: c?.downloadToken,
      downloadTokens: Array.isArray(c?.downloadTokens) ? c.downloadTokens : undefined,
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
    navigate('/payment/paypal/success', { state: { payment: paymentState } });
  };

  // PayPal error handler
  const handlePayPalError = (err: unknown) => {
    console.error('PayPal payment error:', err);
    setPayStatus("error");
    alert(t('payment.failed'));
  };

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

  const totals = calculateTotals();

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
              const unit = Number(item.product.priceWithVat);
              const qty = Number(item.quantity);
              const lineTotal = (unit * qty).toFixed(2);
              return (
                <div
                  key={item.product.variantId}
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
              <span>€{totals.subtotal.toFixed(2)}</span>
            </div>

            {/* Discount Code Display */}
            {discountValidation?.valid && totals.discount > 0 && (
              <div className="breakdown-row discount-row">
                <span>
                  Discount ({discountValidation.code})
                  {discountValidation.discount_type === 'PERCENTAGE' &&
                    ` (${discountValidation.discount_value}%)`}
                </span>
                <span className="discount-amount">-€{totals.discount.toFixed(2)}</span>
              </div>
            )}

            {/* Shipping Display */}
            {selectedShipping && (
              <div className="breakdown-row">
                <span>
                  Shipping ({selectedShipping.rate_name})
                  {(selectedShipping.delivery_days_min || selectedShipping.delivery_days_max) &&
                    ` - ${selectedShipping.delivery_days_min || selectedShipping.delivery_days_max} days`}
                </span>
                <span>
                  {totals.shipping === 0 ? 'FREE' : `€${totals.shipping.toFixed(2)}`}
                </span>
              </div>
            )}

            <div className="breakdown-divider"></div>
            <div className="order-total">
              <span>Total</span>
              <span>€{totals.total.toFixed(2)}</span>
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
            <p className="form-subtitle">We'll send your digital products and invoice to this email address</p>
          </div>

          <form className="checkout-form">
            {/* Personal Information */}
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

            {/* Billing Address Section */}
            <div className="form-section">
              <h3 className="section-title">Billing Address</h3>
              <p className="section-subtitle">This information will be used for your invoice</p>

              {/* B2B Customer Toggle */}
              <div className="form-field checkbox-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isCompany"
                    checked={formData.isCompany}
                    onChange={handleInputChange}
                  />
                  <span>I am purchasing as a company (B2B)</span>
                </label>
                <p className="field-hint">Check this if you need an invoice with company details (IČO, DIČ, IČ DPH)</p>
              </div>

              {/* B2B Fields - Show only if isCompany is checked */}
              {formData.isCompany && (
                <div className="b2b-fields">
                  <div className="form-field">
                    <label htmlFor="companyName">Company Name *</label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required={formData.isCompany}
                      placeholder="Enter company name"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="companyId">IČO (Company ID) *</label>
                      <input
                        type="text"
                        id="companyId"
                        name="companyId"
                        value={formData.companyId}
                        onChange={handleInputChange}
                        required={formData.isCompany}
                        placeholder="12345678"
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="taxId">DIČ (Tax ID) *</label>
                      <input
                        type="text"
                        id="taxId"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleInputChange}
                        required={formData.isCompany}
                        placeholder="1234567890"
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="vatId">IČ DPH (VAT ID)</label>
                    <input
                      type="text"
                      id="vatId"
                      name="vatId"
                      value={formData.vatId}
                      onChange={handleInputChange}
                      placeholder="SK1234567890 (optional)"
                    />
                    <p className="field-hint">Optional - only if you are VAT registered</p>
                  </div>
                </div>
              )}

              <div className="form-field">
                <label htmlFor="billingStreet">Street Address</label>
                <input
                  type="text"
                  id="billingStreet"
                  name="billingStreet"
                  autoComplete="street-address"
                  value={formData.billingStreet}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your street address"
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="billingCity">City</label>
                  <input
                    type="text"
                    id="billingCity"
                    name="billingCity"
                    autoComplete="address-level2"
                    value={formData.billingCity}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your city"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="billingState">State/Province</label>
                  <input
                    type="text"
                    id="billingState"
                    name="billingState"
                    autoComplete="address-level1"
                    value={formData.billingState}
                    onChange={handleInputChange}
                    placeholder="Enter your state (optional)"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="billingPostalCode">Postal Code</label>
                  <input
                    type="text"
                    id="billingPostalCode"
                    name="billingPostalCode"
                    autoComplete="postal-code"
                    value={formData.billingPostalCode}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter postal code"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="billingCountry">Country Code</label>
                  <input
                    type="text"
                    id="billingCountry"
                    name="billingCountry"
                    autoComplete="country"
                    value={formData.billingCountry}
                    onChange={handleInputChange}
                    required
                    placeholder="SK, CZ, DE, etc."
                    maxLength={2}
                    className="text-uppercase"
                  />
                  <p className="field-hint">2-letter country code (e.g., SK for Slovakia)</p>
                </div>
              </div>
            </div>

            {/* Shipping Options */}
            {shippingOptions.length > 0 && (
              <div className="form-section shipping-section">
                <h3 className="section-title">Shipping Method</h3>
                <p className="section-subtitle">Select your preferred shipping option</p>

                {isLoadingShipping && (
                  <div className="loading-message">
                    <span className="loading-spinner">⏳</span> Calculating shipping options...
                  </div>
                )}

                {!isLoadingShipping && (
                  <div className="shipping-options">
                    {shippingOptions.map((option) => (
                      <label
                        key={option.shipping_rate_id}
                        className={`shipping-option ${selectedShipping?.shipping_rate_id === option.shipping_rate_id ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          value={option.shipping_rate_id}
                          checked={selectedShipping?.shipping_rate_id === option.shipping_rate_id}
                          onChange={() => setSelectedShipping(option)}
                        />
                        <div className="shipping-details">
                          <div className="shipping-name">{option.rate_name}</div>
                          <div className="shipping-meta">
                            {(option.delivery_days_min || option.delivery_days_max) && (
                              <span>{option.delivery_days_min || option.delivery_days_max} business days</span>
                            )}
                          </div>
                        </div>
                        <div className="shipping-price">
                          {(option.shipping_cost || 0) === 0 ? 'FREE' : `€${(option.shipping_cost || 0).toFixed(2)}`}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {shippingError && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span> {shippingError}
                  </div>
                )}
              </div>
            )}

            {/* Discount Code Section */}
            <div className="form-section discount-section">
              <h3 className="section-title">Discount Code</h3>
              <p className="section-subtitle">Have a promo code? Enter it here</p>

              {!discountValidation?.valid ? (
                <div className="discount-input-group">
                  <input
                    type="text"
                    className="discount-input"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="Enter discount code"
                    disabled={isValidatingDiscount}
                  />
                  <button
                    type="button"
                    className="apply-discount-btn"
                    onClick={handleValidateDiscount}
                    disabled={isValidatingDiscount || !discountCode.trim()}
                  >
                    {isValidatingDiscount ? 'Validating...' : 'Apply'}
                  </button>
                </div>
              ) : (
                <div className="discount-applied">
                  <div className="discount-badge">
                    <span className="discount-icon">✓</span>
                    <div className="discount-info">
                      <strong>{discountValidation.code}</strong>
                      <span className="discount-description">
                        {discountValidation.discount_type === 'PERCENTAGE'
                          ? `${discountValidation.discount_value}% off`
                          : discountValidation.discount_type === 'FIXED_AMOUNT'
                          ? `€${discountValidation.discount_value} off`
                          : 'Free shipping'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-discount-btn"
                    onClick={handleRemoveDiscount}
                    aria-label="Remove discount code"
                  >
                    ×
                  </button>
                </div>
              )}

              {discountError && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span> {discountError}
                </div>
              )}
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
                    totalAmount={totals.total}
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
                      country: formData.billingCountry,
                      // B2B fields
                      companyName: formData.isCompany ? formData.companyName : undefined,
                      companyId: formData.isCompany ? formData.companyId : undefined,
                      taxId: formData.isCompany ? formData.taxId : undefined,
                      vatId: formData.isCompany && formData.vatId ? formData.vatId : undefined,
                      isCompany: formData.isCompany
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

            {/* Status messages */}
            {payStatus !== "idle" && (
              <div className={`payment-status status-${payStatus}`} role="status" aria-live="polite" aria-atomic="true">
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
};

export default Checkout;
