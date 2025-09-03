import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/useCart';
import './CartPage.css';

const CartPage: React.FC = () => {
  const { items, removeFromCart, updateQuantity, getTotalItems, getTotalPrice } = useCart();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['checkout', 'common']);

  const handleCheckout = () => navigate('/checkout');
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
  const hasPhysicalProducts = items.some(i => i.product.productType === 'PHYSICAL');
  const shipping = items.length > 0 && hasPhysicalProducts ? 5.99 : 0;
  const total = subtotal + shipping;
  const isEmpty = items.length === 0;

  const onQty = (productId: string, next: number, isDigital: boolean) => {
    if (next < 1) return removeFromCart(productId);
    if (isDigital && next > 1) return; // digital max 1 ks
    updateQuantity(productId, next);
  };

  return (
    <div className="cart-page-container">
      <div className="container">
        <header className="header">
          <h1>{t('cart.title')}</h1>
          <p>
            {isEmpty
              ? t('cart.empty_message')
              : `${getTotalItems()} ${t('cart.item_count', { count: getTotalItems() })} ${t('cart.item_prepared', { count: getTotalItems() })}`}
          </p>
        </header>

        {isEmpty ? (
          <section className="cart-items" role="region" aria-labelledby="empty">
            <div className="empty-cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
              </svg>
              <h3 id="empty">{t('cart.empty')}</h3>
              <p>{t('cart.empty_description')}</p>
              <a className="continue-shopping" onClick={handleBackToShopping} href="#stay"
                 aria-label={t('cart.continue_shopping')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M5 12l7 7m-7-7l7-7"/>
                </svg>
                {t('cart.continue_shopping')}
              </a>
            </div>
          </section>
        ) : (
          <div className="cart-layout">
            {/* ITEMS */}
            <section className="cart-items" aria-label={t('cart.items_in_cart')}>
              {items.map(item => {
                const isDigital = item.product.productType === 'DIGITAL';
                const thumb = item.product.gallery?.[0];

                return (
                  <div key={item.product.id} className="cart-item">
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
                          onClick={() => onQty(item.product.id, item.quantity - 1, isDigital)}
                          disabled={item.quantity <= 1}
                        >−</button>
                        <span className="quantity" aria-live="polite">{item.quantity}</span>
                        <button
                          className="quantity-btn"
                          aria-label={t('cart.increase_quantity')}
                          onClick={() => onQty(item.product.id, item.quantity + 1, isDigital)}
                          disabled={isDigital && item.quantity >= 1}
                        >+</button>
                      </div>

                      <div className="item-price">
                        {formatPrice(item.product.price * item.quantity, item.product.currency)}
                      </div>

                      <button
                        className="remove-btn"
                        aria-label={t('cart.remove_item', { product: item.product.name })}
                        onClick={() => removeFromCart(item.product.id)}
                        title={t('cart.remove')}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="6" y1="6" x2="18" y2="18" />
                          <line x1="6" y1="18" x2="18" y2="6" />
                        </svg>
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
                  <span>{shipping > 0 ? formatPrice(shipping) : t('cart.free')}</span>
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

              <button className="checkout-btn" onClick={handleCheckout}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                {t('cart.proceed_to_payment')}
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
};

export default CartPage;