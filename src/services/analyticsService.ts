/**
 * Google Analytics 4 E-commerce Tracking Service
 *
 * Implements GA4 Enhanced E-commerce tracking for the entire shopping funnel.
 *
 * Required: Add VITE_GA4_MEASUREMENT_ID to .env file
 *
 * GA4 E-commerce Events Tracked:
 * - view_item_list: When users view product listings
 * - view_item: When users view product detail page
 * - add_to_cart: When users add items to cart
 * - remove_from_cart: When users remove items from cart
 * - begin_checkout: When checkout process starts
 * - add_shipping_info: When shipping method is selected
 * - add_payment_info: When payment method is entered
 * - purchase: When order is completed
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

import type { Product } from '../data/productData';
import type { CartItem, CartProduct } from '../context/cartContextTypes';
import { logInfo, logWarn, logError } from '../services/logger';

const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || '';

/**
 * GA4 Item structure
 */
interface GA4Item {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_variant?: string;
  price: number;
  quantity: number;
  currency?: string;
}

/**
 * Initialize Google Analytics 4
 */
export const initializeGA4 = (): void => {
  if (!GA4_MEASUREMENT_ID || GA4_MEASUREMENT_ID.trim().length === 0) {
    logWarn('[GA4] No measurement ID configured. Set VITE_GA4_MEASUREMENT_ID in .env');
    return;
  }

  // Check if gtag already exists
  if (window.gtag) {
    logInfo('[GA4] Google Analytics already initialized');
    return;
  }

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA4_MEASUREMENT_ID, {
    send_page_view: true,
    currency: 'EUR', // Default currency
  });

  logInfo('[GA4] Google Analytics initialized:', GA4_MEASUREMENT_ID);
};

/**
 * Convert Product or CartProduct to GA4 Item format
 */
const productToGA4Item = (product: Product | CartProduct, quantity: number = 1): GA4Item => {
  return {
    item_id: product.variantId.toString(),
    item_name: product.name,
    item_brand: 'Martyx Industries',
    item_category: ('productCategory' in product ? product.productCategory : undefined) || 'Uncategorized',
    item_variant: product.variantName || undefined,
    price: product.priceWithVat,
    quantity: quantity,
    currency: product.currency || 'EUR',
  };
};

/**
 * Convert CartItem to GA4 Item format
 */
const cartItemToGA4Item = (cartItem: CartItem): GA4Item => {
  return productToGA4Item(cartItem.product, cartItem.quantity);
};

/**
 * Track view_item_list event
 * Called when user views product listings (Shop, Category pages)
 */
export const trackViewItemList = (products: Product[], listName: string = 'Product Listing'): void => {
  if (!window.gtag) return;

  const items = products.slice(0, 20).map((product, index) => ({
    ...productToGA4Item(product),
    index: index,
    item_list_name: listName,
  }));

  window.gtag('event', 'view_item_list', {
    item_list_name: listName,
    items: items,
  });

  logInfo('[GA4] view_item_list:', listName, `(${items.length} items)`);
};

/**
 * Track view_item event
 * Called when user views product detail page
 */
export const trackViewItem = (product: Product): void => {
  if (!window.gtag) return;

  const item = productToGA4Item(product);

  window.gtag('event', 'view_item', {
    currency: product.currency || 'EUR',
    value: product.priceWithVat,
    items: [item],
  });

  logInfo('[GA4] view_item:', product.name);
};

/**
 * Track add_to_cart event
 * Called when user adds item to cart
 */
export const trackAddToCart = (product: Product | CartProduct, quantity: number = 1): void => {
  if (!window.gtag) return;

  const item = productToGA4Item(product, quantity);

  window.gtag('event', 'add_to_cart', {
    currency: product.currency || 'EUR',
    value: product.priceWithVat * quantity,
    items: [item],
  });

  logInfo('[GA4] add_to_cart:', product.name, `x${quantity}`);
};

/**
 * Track remove_from_cart event
 * Called when user removes item from cart
 */
export const trackRemoveFromCart = (product: Product | CartProduct, quantity: number = 1): void => {
  if (!window.gtag) return;

  const item = productToGA4Item(product, quantity);

  window.gtag('event', 'remove_from_cart', {
    currency: product.currency || 'EUR',
    value: product.priceWithVat * quantity,
    items: [item],
  });

  logInfo('[GA4] remove_from_cart:', product.name, `x${quantity}`);
};

/**
 * Track begin_checkout event
 * Called when user starts checkout process
 */
export const trackBeginCheckout = (cartItems: CartItem[], totalValue: number): void => {
  if (!window.gtag) return;

  const items = cartItems.map(cartItemToGA4Item);

  window.gtag('event', 'begin_checkout', {
    currency: 'EUR',
    value: totalValue,
    items: items,
  });

  logInfo('[GA4] begin_checkout:', `€${totalValue.toFixed(2)}`, `(${items.length} items)`);
};

/**
 * Track add_shipping_info event
 * Called when user selects shipping method
 */
export const trackAddShippingInfo = (
  cartItems: CartItem[],
  totalValue: number,
  shippingMethod: string,
  shippingCost: number
): void => {
  if (!window.gtag) return;

  const items = cartItems.map(cartItemToGA4Item);

  window.gtag('event', 'add_shipping_info', {
    currency: 'EUR',
    value: totalValue,
    shipping_tier: shippingMethod,
    items: items,
  });

  logInfo('[GA4] add_shipping_info:', shippingMethod, `€${shippingCost.toFixed(2)}`);
};

/**
 * Track add_payment_info event
 * Called when user enters payment information
 */
export const trackAddPaymentInfo = (
  cartItems: CartItem[],
  totalValue: number,
  paymentMethod: string = 'Stripe'
): void => {
  if (!window.gtag) return;

  const items = cartItems.map(cartItemToGA4Item);

  window.gtag('event', 'add_payment_info', {
    currency: 'EUR',
    value: totalValue,
    payment_type: paymentMethod,
    items: items,
  });

  logInfo('[GA4] add_payment_info:', paymentMethod);
};

/**
 * Track purchase event
 * Called when order is successfully completed
 */
export const trackPurchase = (
  orderId: string,
  cartItems: CartItem[],
  totalValue: number,
  shippingCost: number,
  tax: number,
  discount: number = 0
): void => {
  if (!window.gtag) return;

  const items = cartItems.map(cartItemToGA4Item);

  window.gtag('event', 'purchase', {
    transaction_id: orderId,
    currency: 'EUR',
    value: totalValue,
    tax: tax,
    shipping: shippingCost,
    coupon: discount > 0 ? 'APPLIED' : undefined,
    items: items,
  });

  logInfo('[GA4] purchase:', orderId, `€${totalValue.toFixed(2)}`);
};

/**
 * Track custom event
 * Generic event tracking for additional analytics
 */
export const trackCustomEvent = (eventName: string, params?: Record<string, any>): void => {
  if (!window.gtag) return;

  window.gtag('event', eventName, params);

  logInfo('[GA4] custom event:', eventName, params);
};

/**
 * Track page view
 * Called on route changes
 */
export const trackPageView = (pagePath: string, pageTitle?: string): void => {
  if (!window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });

  logInfo('[GA4] page_view:', pagePath);
};

/**
 * Type declarations for Google Analytics
 */
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}
