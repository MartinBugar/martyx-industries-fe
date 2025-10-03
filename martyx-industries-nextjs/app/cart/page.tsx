'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/context/useCart';
import styles from './Cart.module.css';

interface CartPageProps {
  // Modal props - when provided, renders as modal
  isOpen?: boolean;
  onClose?: () => void;
  onCheckout?: () => void;
}

// This is the main cart page - modal props are handled separately in components
export default function CartPage() {
  const { items, removeFromCart, updateQuantity, getTotalItems, getTotalPrice } = useCart();
  const router = useRouter();
  const { t, i18n } = useTranslation(['checkout', 'common']);
  const handleCheckout = () => {
    router.push('/checkout');
  };
  const handleBackToShopping = () => router.push('/products');

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
    <div className={styles.cartPageContainer}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1>{t('cart.title', 'Your Cart')} ({getTotalItems()})</h1>
        </div>

        {isEmpty ? (
          <div className={styles.emptyCart}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <h3>{t('cart.empty.title', 'Your cart is empty')}</h3>
            <p>{t('cart.empty.subtitle', 'Add some awesome RC models to get started!')}</p>
            <button className={styles.btnPrimary} onClick={handleBackToShopping}>
              {t('cart.empty.continue_shopping', 'Continue Shopping')}
            </button>
          </div>
        ) : (
          <>
            <div className={styles.cartItems}>
              {items.map((item) => (
                <div key={item.product.id} className={styles.cartItem}>
                  <div className={styles.itemImage}>
                    <img 
                      src={item.product.gallery?.[0] || '/assets/kit-01.png'} 
                      alt={item.product.name}
                      loading="lazy"
                    />
                  </div>
                  <div className={styles.itemDetails}>
                    <h4 className={styles.itemName}>{item.product.name}</h4>
                    <p className={styles.itemType}>
                      {item.product.productType === 'DIGITAL' ? t('common.digital', 'Digital') : t('common.physical', 'Physical')}
                    </p>
                    <div className={styles.itemPrice}>
                      {formatPrice(item.product.price, item.product.currency)}
                    </div>
                  </div>
                  <div className={styles.itemControls}>
                    <div className={styles.quantityControls}>
                      <button 
                        onClick={() => onQty(item.product.id, item.quantity - 1, item.product.productType === 'DIGITAL')}
                        className={styles.qtyBtn}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className={styles.quantity}>{item.quantity}</span>
                      <button 
                        onClick={() => onQty(item.product.id, item.quantity + 1, item.product.productType === 'DIGITAL')}
                        className={styles.qtyBtn}
                        disabled={item.product.productType === 'DIGITAL' && item.quantity >= 1}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className={styles.removeBtn}
                      aria-label="Remove item"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.cartSummary}>
              <div className={styles.summaryRow}>
                <span>{t('cart.subtotal', 'Subtotal')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {hasPhysicalProducts && (
                <div className={styles.summaryRow}>
                  <span>{t('cart.shipping', 'Shipping')}</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
              )}
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>{t('cart.total', 'Total')}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className={styles.cartActions}>
              <button className={styles.btnPrimary} onClick={handleCheckout}>
                {t('cart.proceed_to_checkout', 'Proceed to Checkout')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
