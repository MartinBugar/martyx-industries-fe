import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/useCart';
import './MiniCart.css';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | HTMLButtonElement | null>;
}

const MAX_ITEMS_DISPLAY = 3;

const MiniCart: React.FC<MiniCartProps> = ({ isOpen, onClose, anchorRef }) => {
  const { items, removeFromCart, getTotalItems, getTotalPrice } = useCart();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['cart', 'common']);
  const miniCartRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Don't close if clicking on the anchor (cart icon)
      if (anchorRef?.current?.contains(target)) return;
      // Close if clicking outside minicart
      if (miniCartRef.current && !miniCartRef.current.contains(target)) {
        onClose();
      }
    };

    // Use capture phase to catch clicks before they bubble
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isOpen, onClose, anchorRef]);

  const formatPrice = (amount: number, currency?: string) => {
    const code = currency || 'EUR';
    try {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: code
      }).format(amount);
    } catch {
      return `€${amount.toFixed(2)}`;
    }
  };

  const handleViewCart = () => {
    onClose();
    navigate('/cart');
  };

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleRemoveItem = (variantId: string) => {
    removeFromCart(variantId);
  };

  if (!isOpen) return null;

  const isEmpty = items.length === 0;
  const displayItems = items.slice(0, MAX_ITEMS_DISPLAY);
  const hasMoreItems = items.length > MAX_ITEMS_DISPLAY;
  const total = getTotalPrice();

  return (
    <div className="minicart-dropdown" ref={miniCartRef}>
      {/* Header */}
      <div className="minicart-header">
        <h3 className="minicart-title">
          {t('cart.your_cart', 'Your Cart')}
          {!isEmpty && <span className="minicart-count">({getTotalItems()})</span>}
        </h3>
        <button
          className="minicart-close"
          onClick={onClose}
          aria-label={t('common:close', 'Close')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="minicart-body">
        {isEmpty ? (
          <div className="minicart-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="10" cy="20" r="1"/>
              <circle cx="18" cy="20" r="1"/>
              <path d="M2 3h2l2.4 12.3A2 2 0 0 0 8.8 17h8.9a2 2 0 0 0 2-1.6L22 7H6"/>
            </svg>
            <p>{t('cart.empty', 'Your cart is empty')}</p>
            <button className="minicart-shop-btn" onClick={() => { onClose(); navigate('/products'); }}>
              {t('cart.start_shopping', 'Start Shopping')}
            </button>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="minicart-items">
              {displayItems.map((item) => {
                const thumb = item.product.thumbnailUrl || item.product.imageUrl || item.product.gallery?.[0];
                const isDigital = item.product.variantType === 'DIGITAL_ONLY';

                return (
                  <div key={item.product.variantId} className="minicart-item">
                    {/* Item Image */}
                    <div className="minicart-item-image">
                      {thumb ? (
                        <img src={thumb} alt={item.product.name} />
                      ) : (
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <path d="M3 9h18M9 21V9"/>
                        </svg>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="minicart-item-details">
                      <div className="minicart-item-name">{item.product.name}</div>
                      {item.product.variantName && item.product.variantName !== item.product.name && (
                        <div className="minicart-item-variant">{item.product.variantName}</div>
                      )}
                      <div className="minicart-item-meta">
                        <span className="minicart-item-quantity">
                          {t('cart.qty', 'Qty')}: {item.quantity}
                        </span>
                        {isDigital && (
                          <span className="minicart-item-badge">DIGITAL</span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="minicart-item-price">
                      {formatPrice(item.product.priceWithVat * item.quantity, item.product.currency)}
                    </div>

                    {/* Remove Button */}
                    <button
                      className="minicart-item-remove"
                      onClick={() => handleRemoveItem(item.product.variantId.toString())}
                      aria-label={t('cart.remove_item', { product: item.product.name })}
                      title={t('cart.remove', 'Remove')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* More Items Indicator */}
            {hasMoreItems && (
              <div className="minicart-more">
                + {items.length - MAX_ITEMS_DISPLAY} {t('cart.more_items', 'more items')}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {!isEmpty && (
        <div className="minicart-footer">
          {/* Subtotal */}
          <div className="minicart-subtotal">
            <span>{t('cart.subtotal', 'Subtotal')}:</span>
            <span className="minicart-subtotal-amount">{formatPrice(total)}</span>
          </div>

          {/* Actions */}
          <div className="minicart-actions">
            <button
              className="minicart-btn minicart-btn-secondary"
              onClick={handleViewCart}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="20" r="1"/>
                <circle cx="18" cy="20" r="1"/>
                <path d="M2 3h2l2.4 12.3A2 2 0 0 0 8.8 17h8.9a2 2 0 0 0 2-1.6L22 7H6"/>
              </svg>
              {t('cart.view_cart', 'View Cart')}
            </button>
            <button
              className="minicart-btn minicart-btn-primary"
              onClick={handleCheckout}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              {t('cart.checkout', 'Checkout')}
            </button>
          </div>

          {/* Security Badge */}
          <div className="minicart-security">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="10" rx="2"/>
              <path d="M12 11V7a5 5 0 010-10"/>
            </svg>
            <span>{t('cart.secure_checkout', 'Secure Checkout')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniCart;
