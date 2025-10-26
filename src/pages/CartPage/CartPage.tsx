import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/useCart';
import { shippingService } from '../../services/shippingService';
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
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['checkout', 'common']);
  const modalRef = useRef<HTMLDivElement>(null);

  // Modal mode vs Page mode
  const isModal = Boolean(isOpen !== undefined);

  // Shipping state - fetch real shipping costs from backend
  const [cheapestShipping, setCheapestShipping] = useState<number | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  
  const handleCheckout = () => {
    if (isModal && onCheckout) {
      onCheckout();
    } else {
      navigate('/checkout');
    }
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
          const weight = (item.product as any).weightKg || 0.5; // Default 0.5kg if not specified
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
  const shipping = isLoadingShipping ? null : (cheapestShipping ?? 0);
  const total = subtotal + (shipping ?? 0);
  const isEmpty = items.length === 0;

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
        
        {!isModal && (
          <header className="header">
            <h1>{t('cart.title')}</h1>
            <p>
              {isEmpty
                ? t('cart.empty_message')
                : `${getTotalItems()} ${t('cart.item_count', { count: getTotalItems() })} ${t('cart.item_prepared', { count: getTotalItems() })}`}
            </p>
          </header>
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
            {/* ITEMS */}
            <section className="cart-items" aria-label={t('cart.items_in_cart')}>
              {items.map(item => {
                const isDigital = item.product.variantType === 'DIGITAL_ONLY';
                const thumb = item.product.gallery?.[0];

                return (
                  <div key={item.product.variantId} className="cart-item">
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

                      <div className="item-type" aria-label={isDigital ? t('cart.digital_product') : t('cart.physical_product')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12.5L10 17.5L20 6.5"/>
                        </svg>
                        {isDigital ? 'DIGITAL' : 'PHYSICAL'}
                      </div>
                    </div>

                    <div className="item-price-section">
                      <div className="quantity-control" aria-label={t('cart.adjust_quantity', { product: item.product.name })}>
                        <button
                          className="quantity-btn"
                          aria-label={t('cart.decrease_quantity')}
                          onClick={() => onQty(item.product.variantId.toString(), item.quantity - 1, isDigital)}
                          disabled={item.quantity <= 1}
                        >−</button>
                        <span className="quantity" aria-live="polite">{item.quantity}</span>
                        <button
                          className="quantity-btn"
                          aria-label={t('cart.increase_quantity')}
                          onClick={() => onQty(item.product.variantId.toString(), item.quantity + 1, isDigital)}
                          disabled={isDigital && item.quantity >= 1}
                        >+</button>
                      </div>

                      <div className="item-price">
                        {formatPrice(item.product.priceWithVat * item.quantity, item.product.currency)}
                      </div>

                      <button
                        className="remove-btn"
                        aria-label={t('cart.remove_item', { product: item.product.name })}
                        onClick={() => removeFromCart(item.product.variantId.toString())}
                        title={t('cart.remove')}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}

              <a className="continue-shopping" onClick={handleBackToShopping} href="#stay" aria-label={t('cart.continue_shopping')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M5 12l7 7m-7-7l7-7"/>
                </svg>
                {t('cart.continue_shopping')}
              </a>
            </section>

            {/* SUMMARY */}
            <aside className="order-summary" aria-label={t('order_summary.title')}>
              <h2 className="summary-title">{t('order_summary.title')}</h2>

              <div className="summary-row">
                <span>{t('order_summary.subtotal')} ({getTotalItems()} {t('cart.item_count', { count: getTotalItems() })})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {hasPhysicalProducts ? (
                <div className="summary-row">
                  <span>{t('order_summary.shipping')}</span>
                  <span>
                    {isLoadingShipping ? (
                      <span style={{ opacity: 0.6 }}>Calculating...</span>
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