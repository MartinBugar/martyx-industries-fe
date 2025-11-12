import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import { shippingService } from '../../services/shippingService';
import { discountService } from '../../services/discountService';
import GiftProgressBar from '../../components/GiftProgressBar/GiftProgressBar';
import './CartPage.css';

interface CartPageProps {
  // Modal props - when provided, renders as modal
  isOpen?: boolean;
  onClose?: () => void;
  onCheckout?: () => void;
}

const CartPage: React.FC<CartPageProps> = ({
  isOpen,
  onClose,
  onCheckout
}) => {
  const { items, removeFromCart, updateQuantity, getTotalItems, getTotalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['checkout', 'common']);
  const modalRef = useRef<HTMLDivElement>(null);

  // Modal mode vs Page mode
  const isModal = Boolean(isOpen !== undefined);

  // Shipping state - fetch real shipping costs from backend
  const [cheapestShipping, setCheapestShipping] = useState<number | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);

  // Discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  } | null>(null);
  const [discountError, setDiscountError] = useState('');
  
  const handleCheckout = () => {
    if (isModal && onCheckout) {
      onCheckout();
    } else {
      navigate('/checkout');
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError(t('cart.discount_code_required', 'Please enter a discount code'));
      return;
    }

    // Clear previous errors
    setDiscountError('');

    try {
      // Call backend API to validate discount code
      const validation = await discountService.validateDiscount(
        discountCode.trim(),
        subtotal,
        user?.id ? parseInt(user.id, 10) : undefined
      );

      if (validation.valid && validation.calculated_discount_amount !== undefined) {
        // Determine discount type from response
        let discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' = 'FIXED_AMOUNT';
        if (validation.discount_type === 'PERCENTAGE') {
          discountType = 'PERCENTAGE';
        } else if (validation.discount_type === 'FREE_SHIPPING') {
          discountType = 'FREE_SHIPPING';
        }

        setAppliedDiscount({
          code: validation.code || discountCode.toUpperCase(),
          amount: validation.calculated_discount_amount,
          type: discountType,
        });
        setDiscountCode(''); // Clear input after successful application

        console.log('✅ [DISCOUNT] Applied:', validation.code, '→ €' + validation.calculated_discount_amount);
      } else {
        // Invalid discount
        const errorMsg = validation.error_message || t('cart.invalid_discount_code', 'Invalid discount code');
        setDiscountError(errorMsg);
        setAppliedDiscount(null);

        console.warn('❌ [DISCOUNT] Validation failed:', errorMsg);
      }
    } catch (error) {
      console.error('❌ [DISCOUNT] API error:', error);

      // Handle API errors gracefully
      const errorMsg = error instanceof Error && error.message
        ? error.message
        : t('cart.discount_validation_error', 'Unable to validate discount code. Please try again.');

      setDiscountError(errorMsg);
      setAppliedDiscount(null);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
  };

  // Modal-specific functionality
  useEffect(() => {
    if (!isModal || !isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => modalRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isModal, isOpen, onClose]);

  // Fetch real shipping costs from backend (same logic as Checkout page)
  useEffect(() => {
    const hasPhysicalProducts = items.some(i => i.product.requiresShipping);

    // Only fetch shipping if we have physical products
    if (!hasPhysicalProducts || items.length === 0) {
      setCheapestShipping(0);
      return;
    }

    const fetchShipping = async () => {
      setIsLoadingShipping(true);

      try {
        // Calculate cart weight (same logic as Checkout)
        const totalWeight = items.reduce((total, item) => {
          const weight = item.product.weightKg || 0.5; // Default 0.5kg if not specified
          return total + (weight * item.quantity);
        }, 0);

        // Use Slovakia (SK) as default country, same as checkout page
        const response = await shippingService.calculateShipping({
          destination_country_code: 'SK',
          total_weight_kg: totalWeight,
          order_subtotal: getTotalPrice(),
          destination_postal_code: undefined
        });

        if (response.available_rates && response.available_rates.length > 0) {
          // Get cheapest shipping option (first one is cheapest, sorted by backend)
          const cheapest = response.available_rates[0];
          setCheapestShipping(cheapest.shipping_cost || 0);
        } else {
          // No shipping options available, set to 0
          setCheapestShipping(0);
        }
      } catch (error) {
        console.error('Error fetching shipping costs:', error);
        // On error, fallback to 0 instead of showing wrong price
        setCheapestShipping(0);
      } finally {
        setIsLoadingShipping(false);
      }
    };

    fetchShipping();
  }, [items, getTotalPrice]);

  const handleViewFullCart = () => {
    if (onClose) onClose();
    navigate('/cart');
  };
  const handleBackToShopping = () => navigate('/products');

  // Robust currency formatting with i18n locale
  const formatPrice = (amount: number, currency?: string) => {
    const code = currency || (items[0]?.product?.currency ?? 'EUR');
    try {
      return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: code }).format(amount);
    } catch {
      // fallback for custom currencies
      const suffix = code === 'EUR' ? '€' : code;
      return `${amount.toFixed(2)} ${suffix}`;
    }
  };

  const subtotal = getTotalPrice();
  const hasPhysicalProducts = items.some(i => i.product.requiresShipping);
  // Use fetched shipping cost instead of hardcoded value
  // While loading, use null to show loading state; otherwise use fetched value or 0
  let shipping = isLoadingShipping ? null : (cheapestShipping ?? 0);

  // Apply discount
  const discountAmount = appliedDiscount?.amount ?? 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  // Free shipping discount
  if (appliedDiscount?.type === 'FREE_SHIPPING') {
    shipping = 0;
  }

  // VAT calculation - use VAT rate from products (Slovak VAT is 23%)
  // Get VAT rate from first product (assuming all products have same VAT rate)
  const VAT_RATE = items.length > 0 && items[0].product.vatRate ? (items[0].product.vatRate / 100) : 0.23;
  const VAT_PERCENTAGE = Math.round(VAT_RATE * 100);

  // Calculate subtotal without VAT and VAT amount
  const subtotalWithoutVat = subtotalAfterDiscount / (1 + VAT_RATE);
  const vatAmount = subtotalAfterDiscount - subtotalWithoutVat;

  const total = subtotalAfterDiscount + (shipping ?? 0);
  const isEmpty = items.length === 0;

  // Free shipping calculation
  const FREE_SHIPPING_THRESHOLD = 50; // €50
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || appliedDiscount?.type === 'FREE_SHIPPING';

  const onQty = (variantId: string, next: number, isDigital: boolean) => {
    if (next < 1) return removeFromCart(variantId);
    if (isDigital && next > 1) return; // digital max 1 ks
    updateQuantity(variantId, next);
  };

  // Don't render modal when closed
  if (isModal && !isOpen) return null;

  const content = (
    <div className={isModal ? "cart-modal-content" : "cart-page-container"}>
      <div className="container">
        {isModal && (
          <div className="modal-header">
            <h2>Your Cart ({getTotalItems()})</h2>
            <button className="close-icon-btn" aria-label="Close cart" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        {isEmpty ? (
          <section className="cart-items" role="region" aria-labelledby="empty">
            <div className="empty-cart">
              <div className="empty-cart-mascot">
                <img 
                  src="/cassandra/Empty-Cass.png" 
                  alt="Cassandra - váš sprievodca prázdnym košíkom"
                  className="mascot-image-empty-cart"
                  loading="eager"
                  decoding="sync"
                />
              </div>
              <div className="empty-cart-content">
                <h3 id="empty">{t('cart.empty')}</h3>
                <p>{t('cart.empty_description')}</p>
                <button className="continue-shopping-btn" onClick={handleBackToShopping}
                       aria-label={t('cart.continue_shopping')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M5 12l7 7m-7-7l7-7"/>
                  </svg>
                  {t('cart.continue_shopping')}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div className="cart-layout">
            {/* ITEMS TABLE */}
            <section className="cart-items" aria-label={t('cart.items_in_cart')}>
              <table className="cart-items-table">
                <thead>
                  <tr>
                    <th>{t('cart.product', 'Product')}</th>
                    <th style={{width: '140px', textAlign: 'center'}}>{t('cart.quantity', 'Quantity')}</th>
                    <th style={{width: '180px', textAlign: 'right'}}>{t('cart.price', 'Price')}</th>
                    <th style={{width: '60px'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const isDigital = item.product.variantType === 'DIGITAL_ONLY';
                    const thumb = item.product.gallery?.[0];

                    return (
                      <tr key={item.product.variantId} className="cart-item">
                        {/* Product Cell */}
                        <td>
                          <div className="product-cell">
                            <div className="item-image" aria-hidden="true">
                              {thumb ? (
                                <img src={thumb} alt={item.product.name}/>
                              ) : (
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                                  <path d="M3 9h18"/>
                                  <path d="M9 21V9"/>
                                </svg>
                              )}
                            </div>

                            <div className="item-details">
                              <div className="item-name">{item.product.name}</div>

                              {item.product.variantName && item.product.variantName !== item.product.name && (
                                <div className="item-variant-name">{item.product.variantName}</div>
                              )}

                              {item.product.sku && (
                                <div className="item-sku">SKU: {item.product.sku}</div>
                              )}

                              <div className="item-badges">
                                <div className="item-type" aria-label={isDigital ? t('cart.digital_product') : t('cart.physical_product')}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12.5L10 17.5L20 6.5"/>
                                  </svg>
                                  {isDigital ? 'DIGITAL' : 'PHYSICAL'}
                                </div>

                                {/* Stock Availability Badge */}
                                {item.product.availabilityStatus === 'IN_STOCK' && (
                                  <div className="stock-badge stock-in-stock">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10"/>
                                      <path d="M9 12l2 2l4-4"/>
                                    </svg>
                                    {item.product.stockQuantity <= 10 && item.product.stockQuantity > 0
                                      ? `${t('cart.low_stock', 'Low stock')} (${item.product.stockQuantity} ${t('cart.left', 'left')})`
                                      : t('cart.in_stock', 'In Stock')}
                                  </div>
                                )}

                                {item.product.availabilityStatus === 'OUT_OF_STOCK' && (
                                  <div className="stock-badge stock-out-of-stock">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10"/>
                                      <line x1="15" y1="9" x2="9" y2="15"/>
                                      <line x1="9" y1="9" x2="15" y2="15"/>
                                    </svg>
                                    {t('cart.out_of_stock', 'Out of Stock')}
                                  </div>
                                )}

                                {item.product.availabilityStatus === 'PRE_ORDER' && (
                                  <div className="stock-badge stock-pre-order">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10"/>
                                      <path d="M12 6v6l4 2"/>
                                    </svg>
                                    {t('cart.pre_order', 'Pre-Order')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Quantity Cell */}
                        <td>
                          <div className="quantity-control" aria-label={t('cart.adjust_quantity', { product: item.product.name })}>
                            <button
                              className="quantity-btn"
                              aria-label={t('cart.decrease_quantity')}
                              onClick={() => onQty(item.product.variantId.toString(), item.quantity - 1, isDigital)}
                              disabled={item.quantity <= 1}
                              title={item.quantity <= 1 ? t('cart.minimum_quantity', 'Minimum quantity is 1') : undefined}
                            >−</button>
                            <span className="quantity" aria-live="polite">{item.quantity}</span>
                            <button
                              className="quantity-btn"
                              aria-label={t('cart.increase_quantity')}
                              onClick={() => onQty(item.product.variantId.toString(), item.quantity + 1, isDigital)}
                              disabled={isDigital && item.quantity >= 1}
                              title={isDigital && item.quantity >= 1 ? t('cart.digital_product_limit', 'Digital products are limited to 1 per order') : undefined}
                            >+</button>
                          </div>
                        </td>

                        {/* Price Cell */}
                        <td>
                          <div className="item-price">
                            <div className="unit-price">{formatPrice(item.product.priceWithVat, item.product.currency)} × {item.quantity}</div>
                            <div className="total-price">{formatPrice(item.product.priceWithVat * item.quantity, item.product.currency)}</div>
                          </div>
                        </td>

                        {/* Remove Cell */}
                        <td>
                          <button
                            className="remove-btn"
                            aria-label={t('cart.remove_item', { product: item.product.name })}
                            onClick={() => removeFromCart(item.product.variantId.toString())}
                            title={t('cart.remove')}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Gift Tier Progress Bar - Under cart items */}
              <GiftProgressBar cartTotal={subtotal} compact={true} />

              <button className="continue-shopping" onClick={handleBackToShopping} aria-label={t('cart.continue_shopping')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M5 12l7 7m-7-7l7-7"/>
                </svg>
                {t('cart.continue_shopping')}
              </button>
            </section>

            {/* SUMMARY */}
            <aside className="order-summary" aria-label={t('order_summary.title')}>
              <h2 className="summary-title">{t('order_summary.title')}</h2>

              {/* Free Shipping Progress Bar */}
              {hasPhysicalProducts && !hasFreeShipping && (
                <div className="free-shipping-banner">
                  <div className="free-shipping-text">
                    🚚 {t('cart.add_more_for_free_shipping', 'Add')} {formatPrice(amountToFreeShipping)} {t('cart.more_for_free_shipping', 'more for FREE shipping!')}
                  </div>
                  <div className="free-shipping-progress-bar">
                    <div
                      className="free-shipping-progress-fill"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                  <div className="free-shipping-percentage">{Math.round(freeShippingProgress)}%</div>
                </div>
              )}

              {hasPhysicalProducts && hasFreeShipping && (
                <div className="free-shipping-banner free-shipping-achieved">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12.5L10 17.5L20 6.5"/>
                  </svg>
                  🎉 {t('cart.free_shipping_unlocked', 'You\'ve unlocked FREE shipping!')}
                </div>
              )}

              {/* Discount Code Section */}
              <div className="discount-section">
                {appliedDiscount ? (
                  <div className="applied-discount">
                    <div className="discount-badge">
                      🎉 {appliedDiscount.code} {t('cart.applied', 'Applied')}
                    </div>
                    <button
                      className="remove-discount-btn"
                      onClick={handleRemoveDiscount}
                      aria-label={t('cart.remove_discount', 'Remove discount')}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="discount-input-wrapper">
                    <input
                      type="text"
                      className="discount-input"
                      placeholder={t('cart.enter_discount_code', 'Enter discount code')}
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                    />
                    <button
                      className="apply-discount-btn"
                      onClick={handleApplyDiscount}
                      aria-label={t('cart.apply_discount', 'Apply discount')}
                    >
                      {t('cart.apply', 'Apply')}
                    </button>
                  </div>
                )}
                {discountError && <div className="discount-error">{discountError}</div>}
              </div>

              <div className="summary-row">
                <span>{t('order_summary.subtotal')} ({getTotalItems()} {t('cart.item_count', { count: getTotalItems() })})</span>
                <span>{formatPrice(subtotal / (1 + VAT_RATE))}</span>
              </div>

              {appliedDiscount && appliedDiscount.type !== 'FREE_SHIPPING' && (
                <div className="summary-row discount-row">
                  <span>{t('order_summary.discount', 'Discount')} ({appliedDiscount.code})</span>
                  <span className="discount-amount">-{formatPrice(discountAmount / (1 + VAT_RATE))}</span>
                </div>
              )}

              <div className="summary-row">
                <span>{t('order_summary.vat', 'VAT')} ({VAT_PERCENTAGE}%)</span>
                <span>{formatPrice(vatAmount)}</span>
              </div>

              {hasPhysicalProducts ? (
                <div className="summary-row">
                  <span>{t('order_summary.shipping')}</span>
                  <span>
                    {isLoadingShipping ? (
                      <span className="calculating-text">Calculating...</span>
                    ) : shipping !== null && shipping > 0 ? (
                      formatPrice(shipping)
                    ) : (
                      t('cart.free')
                    )}
                  </span>
                </div>
              ) : (
                <div className="delivery-info">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13"/>
                    <path d="M16 8h4l3 3v5h-7V8z"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/>
                    <circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  <span>{t('cart.digital_delivery')}</span>
                </div>
              )}

              <div className="summary-row total">
                <span>{t('order_summary.total')}</span>
                <span>{formatPrice(total)}</span>
              </div>

              {appliedDiscount && discountAmount > 0 && (
                <div className="savings-message">
                  🎉 {t('cart.you_saved', 'You saved')} {formatPrice(discountAmount)}!
                </div>
              )}

              {isModal && (
                <button className="view-cart-btn" onClick={handleViewFullCart}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                  </svg>
                  View Full Cart
                </button>
              )}

              <button className="checkout-btn" onClick={handleCheckout}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                {isModal ? 'Secure Checkout' : t('cart.proceed_to_payment')}
              </button>

              <div className="secure-text">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="11" width="14" height="10" rx="2"/>
                  <path d="M12 11V7a5 5 0 010-10"/>
                </svg>
                {t('cart.secure_payment')}
              </div>

              {/* Trust Badges */}
              <div className="trust-badges">
                <div className="trust-badges-title">{t('cart.we_accept', 'We accept:')}</div>
                <div className="payment-methods">
                  <div className="payment-badge" title="Stripe">
                    <svg viewBox="0 0 60 40" width="60" height="40">
                      <rect width="60" height="40" rx="6" fill="#635BFF"/>
                      <text x="30" y="26" textAnchor="middle" fill="white" fontSize="16" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">stripe</text>
                    </svg>
                  </div>
                </div>
                <div className="security-badges">
                  <div className="security-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                      <rect x="5" y="11" width="14" height="10" rx="2"/>
                      <path d="M12 11V7a5 5 0 010-10"/>
                    </svg>
                    <span>{t('cart.ssl_encrypted', '256-bit SSL encrypted')}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );

  // Return modal wrapper if in modal mode
  if (isModal) {
    return (
      <div className="cart-modal" aria-hidden={!isOpen} onClick={onClose}>
        <div
          className="cart-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-modal-title"
          onClick={(e) => e.stopPropagation()}
          ref={modalRef}
          tabIndex={-1}
        >
          {content}
        </div>
      </div>
    );
  }

  // Return page content directly
  return content;
};

export default CartPage;