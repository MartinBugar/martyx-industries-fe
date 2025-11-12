import React, { useEffect, useMemo, useState, type ReactNode, useCallback } from 'react';
import type { Product } from '../data/productData';
import { CartContext, type CartItem, type CartProduct } from './cartContextTypes';
import { cartService } from '../services/cartService';
import { useAuth } from './useAuth';
import { trackAddToCart, trackRemoveFromCart } from '../services/analyticsService';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';

// Props for the CartProvider component
interface CartProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'martyx_cart_v1';
const SESSION_ID_KEY = 'martyx_session_id';
const CART_EXPIRATION_DAYS = 30; // Cart items expire after 30 days
const CART_EXPIRATION_MS = CART_EXPIRATION_DAYS * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Generate a cryptographically secure unique session ID for guest users
function generateSessionId(): string {
  // Use crypto.getRandomValues() for cryptographic randomness (much better than Math.random())
  const array = new Uint8Array(16); // 128 bits of entropy
  crypto.getRandomValues(array);

  // Convert to hex string
  const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

  return `guest_${hex}`;
}

// Get or create session ID
function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Convert full Product to CartProduct (only keep fields needed in cart)
function toCartProduct(product: Product): CartProduct {
  return {
    variantId: product.variantId,
    masterProductId: product.masterProductId,
    name: product.name,
    variantName: product.variantName,
    priceWithVat: product.priceWithVat,
    imageUrl: product.gallery?.[0],
    availabilityStatus: product.availabilityStatus,
    stockQuantity: product.stockQuantity,
    variantType: product.variantType,
    sku: product.sku,
    gallery: product.gallery,
    currency: product.currency,
    requiresShipping: product.requiresShipping,
    vatRate: product.vatRate
  };
}

type UnknownRecord = Record<string, unknown>;
function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

/**
 * Check if an item is expired (older than 30 days)
 */
function isItemExpired(item: CartItem): boolean {
  if (!item.addedAt) return true; // If no timestamp, consider it expired (legacy data)
  const now = Date.now();
  const age = now - item.addedAt;
  return age > CART_EXPIRATION_MS;
}

/**
 * Type guard for CartItem with backward compatibility
 */
function isCartItem(value: unknown): value is CartItem {
  if (!isRecord(value)) return false;
  const rec = value as UnknownRecord;

  // Must have product and quantity
  if (!('product' in rec) || !('quantity' in rec) || typeof rec['quantity'] !== 'number') {
    return false;
  }

  // If addedAt is missing, add it (backward compatibility with old cart data)
  if (!('addedAt' in rec) || typeof rec['addedAt'] !== 'number') {
    (rec as unknown as CartItem).addedAt = Date.now();
  }

  return true;
}

function safeLoad(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter valid items
    const validItems = parsed.filter(isCartItem);

    // Filter out expired items
    const activeItems = validItems.filter(item => !isItemExpired(item));
    const expiredItems = validItems.filter(item => isItemExpired(item));

    // Log expired items if any
    if (expiredItems.length > 0) {
      console.log(`[Cart] Removed ${expiredItems.length} expired item(s) (older than ${CART_EXPIRATION_DAYS} days)`);
      expiredItems.forEach(item => {
        const daysOld = Math.floor((Date.now() - item.addedAt) / (24 * 60 * 60 * 1000));
        console.log(`[Cart] Expired: ${item.product.name} (${daysOld} days old)`);
      });

      // Update localStorage with only active items
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeItems));
      } catch (e) {
        console.warn('[Cart] Failed to update cart after removing expired items:', e);
      }
    }

    return activeItems;
  } catch (e) {
    console.warn('[Cart] Failed to load persisted cart:', e);
    return [];
  }
}

// CartProvider component to wrap the app and provide cart functionality
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  // CRITICAL: Don't load from localStorage if payment is in progress
  // This prevents re-adding items after successful payment
  const [items, setItems] = useState<CartItem[]>(() => {
    const paymentInProgress = sessionStorage.getItem('payment_in_progress');
    if (paymentInProgress === 'true') {
      console.log('[Cart] Payment in progress detected - clearing localStorage and initializing with empty cart');
      // Clear localStorage immediately to prevent any re-sync attempts
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn('[Cart] Failed to clear localStorage:', e);
      }
      return [];
    }
    return safeLoad();
  });
  const [sessionId] = useState<string>(() => getSessionId());
  const [isSyncing, setIsSyncing] = useState(false);

  // Debounced backend sync for quantity updates (500ms delay)
  // This prevents excessive API calls when users rapidly change quantities
  const debouncedUpdateQuantity = useDebouncedCallback(
    (variantId: number, quantity: number) => {
      void cartService
        .updateQuantity(variantId, quantity, isAuthenticated ? undefined : sessionId)
        .catch(err => console.warn('[Cart] Failed to update quantity in backend:', err));
    },
    500
  );

  // Persist to localStorage for offline support
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('[Cart] Failed to persist cart:', e);
    }
  }, [items]);

  // Sync with backend on mount and when auth state changes
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        setIsSyncing(true);

        // CRITICAL: Check if user just initiated payment (flag set BEFORE Stripe redirect)
        // This prevents cart sync while user is on Stripe checkout page
        const paymentInProgress = sessionStorage.getItem('payment_in_progress');
        if (paymentInProgress === 'true') {
          console.log('[Cart] Payment in progress - clearing local cart state and waiting for StripeSuccess');
          // Clear items from state immediately to prevent re-sync
          setItems([]);
          // Don't clear the flag yet - StripeSuccess will handle it
          setIsSyncing(false);
          return;
        }

        console.log('[Cart] Syncing with backend...');

        // Get current localStorage cart
        const localItems = safeLoad();

        // For authenticated users, don't pass sessionId (backend uses JWT)
        // For guests, pass sessionId
        const backendCart = await cartService.getCart(
          isAuthenticated ? undefined : sessionId
        );

        // Use new items array from backend (CartItemDto[])
        if (backendCart.items && Array.isArray(backendCart.items) && backendCart.items.length > 0) {
          // Convert backend CartItemDto[] to frontend CartItem[] format
          const convertedItems: CartItem[] = backendCart.items.map(item => ({
            product: {
              variantId: item.variantId,
              masterProductId: item.masterProductId,
              name: item.masterProductName,
              variantName: item.variantName,
              priceWithVat: item.priceWithVat,
              imageUrl: item.imageUrl,
              availabilityStatus: 'IN_STOCK' as const,
              stockQuantity: item.quantity,
              variantType: 'PHYSICAL_ONLY' as const
            },
            quantity: item.quantity,
            addedAt: Date.now()
          }));

          console.log('[Cart] Synced from backend:', convertedItems.length, 'items');
          setItems(convertedItems);
        } else if (backendCart.items && backendCart.items.length === 0) {
          // Backend has empty cart
          console.log('[Cart] Backend cart is empty');

          if (localItems.length > 0) {
            // localStorage has items - push them to backend
            // This handles offline cart recovery
            console.log('[Cart] No cart in backend, but localStorage has', localItems.length, 'items. Syncing localStorage → backend...');
            setItems(localItems);

            // Push each item to backend using updateQuantity to SET quantity, not ADD
            for (const item of localItems) {
              try {
                // Use updateQuantity instead of addItem to SET the exact quantity
                // This prevents duplication on multiple syncs
                await cartService.updateQuantity(
                  item.product.variantId,
                  item.quantity,
                  isAuthenticated ? undefined : sessionId
                );
              } catch (err) {
                // If updateQuantity fails (item doesn't exist), try addItem
                try {
                  await cartService.addItem(
                    item.product.variantId,
                    item.quantity,
                    isAuthenticated ? undefined : sessionId
                  );
                } catch (addErr) {
                  console.warn('[Cart] Failed to sync item to backend:', addErr);
                }
              }
            }
            console.log('[Cart] Successfully synced localStorage cart to backend');
          } else {
            // Both backend and localStorage are empty
            console.log('[Cart] No cart in backend and localStorage is empty');
            setItems([]);
          }
        }
      } catch (error) {
        console.warn('[Cart] Failed to sync with backend, using localStorage:', error);
        // If backend fails, keep localStorage cart
        const localItems = safeLoad();
        if (localItems.length > 0) {
          console.log('[Cart] Using localStorage cart with', localItems.length, 'items');
          setItems(localItems);
        }
      } finally {
        setIsSyncing(false);
      }
    };

    // Only sync if not already syncing
    if (!isSyncing) {
      void syncWithBackend();
    }
  }, [isAuthenticated]); // Re-sync when auth state changes

  // Add a product to the cart with stock validation
  const addToCart = (product: Product): 'added' | 'limit' | 'out_of_stock' | 'discontinued' | 'pre_order' => {
    // Check availability status first
    if (product.availabilityStatus === 'OUT_OF_STOCK') {
      console.warn('[Cart] Product is out of stock:', product.name);
      return 'out_of_stock';
    }

    if (product.availabilityStatus === 'DISCONTINUED') {
      console.warn('[Cart] Product is discontinued:', product.name);
      return 'discontinued';
    }

    // Digital products can be sold even when stock is 0 (they don't deplete)
    const isDigitalProduct = product.variantType === 'DIGITAL_ONLY';

    // For physical products, check stock quantity
    if (!isDigitalProduct && product.stockQuantity <= 0) {
      console.warn('[Cart] Product stock is 0:', product.name, 'Stock:', product.stockQuantity);
      return 'out_of_stock';
    }

    let result: 'added' | 'limit' | 'out_of_stock' | 'discontinued' | 'pre_order' = 'added';
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.product.variantId === product.variantId);
      if (existingItemIndex >= 0) {
        const existingItem = prevItems[existingItemIndex];

        // If the variant is DIGITAL_ONLY, enforce max quantity of 1
        if (existingItem.product.variantType === 'DIGITAL_ONLY') {
          result = 'limit';
          return prevItems;
        }

        // Check if adding one more would exceed available stock
        const newQuantity = existingItem.quantity + 1;
        if (!isDigitalProduct && newQuantity > product.stockQuantity) {
          console.warn('[Cart] Cannot add more items. Stock limit reached:', product.stockQuantity);
          result = 'limit';
          return prevItems;
        }

        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity
        };
        result = 'added';

        // Sync to backend (non-blocking)
        void cartService
          .addItem(product.variantId, 1, isAuthenticated ? undefined : sessionId)
          .catch(err => {
            // If duplicate/conflict, ignore - the other request will succeed
            if (err?.message?.includes('already in cart') || err?.status === 409) {
              console.log('[Cart] Item already being added, ignoring duplicate request');
            } else {
              console.warn('[Cart] Failed to add to backend:', err);
            }
          });

        // Track analytics
        trackAddToCart(product, 1);

        return updatedItems;
      } else {
        // Adding product for the first time - check if stock allows at least 1
        if (!isDigitalProduct && product.stockQuantity < 1) {
          result = 'out_of_stock';
          return prevItems;
        }

        result = 'added';
        const updatedItems = [...prevItems, { product: toCartProduct(product), quantity: 1, addedAt: Date.now() }];

        // Sync to backend (non-blocking)
        void cartService
          .addItem(product.variantId, 1, isAuthenticated ? undefined : sessionId)
          .catch(err => {
            // If duplicate/conflict, ignore - the other request will succeed
            if (err?.message?.includes('already in cart') || err?.status === 409) {
              console.log('[Cart] Item already being added, ignoring duplicate request');
            } else {
              console.warn('[Cart] Failed to add to backend:', err);
            }
          });

        // Track analytics
        trackAddToCart(product, 1);

        return updatedItems;
      }
    });
    return result;
  };

  // Remove a product from the cart by variant ID
  const removeFromCart = (variantId: string) => {
    setItems(prevItems => {
      // Find the item being removed for analytics
      const itemToRemove = prevItems.find(item => item.product.variantId.toString() === variantId);

      const filtered = prevItems.filter(item => item.product.variantId.toString() !== variantId);

      // Sync to backend (non-blocking)
      const variantIdNum = parseInt(variantId, 10);
      if (!isNaN(variantIdNum)) {
        void cartService
          .removeItem(variantIdNum, isAuthenticated ? undefined : sessionId)
          .catch(err => console.warn('[Cart] Failed to remove from backend:', err));
      }

      // Track analytics
      if (itemToRemove) {
        trackRemoveFromCart(itemToRemove.product, itemToRemove.quantity);
      }

      return filtered;
    });
  };

  // Update the quantity of a product in the cart by variant ID
  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item => {
        if (item.product.variantId.toString() !== variantId) return item;
        const isDigital = item.product.variantType === 'DIGITAL_ONLY';
        const nextQty = isDigital ? 1 : quantity;

        // Sync to backend with debouncing (prevents excessive API calls during rapid changes)
        debouncedUpdateQuantity(item.product.variantId, nextQty);

        return { ...item, quantity: nextQty };
      })
    );
  };

  // Clear all items from the cart
  const clearCart = () => {
    setItems(prevItems => {
      // Remove each item from backend
      prevItems.forEach(item => {
        void cartService
          .removeItem(item.product.variantId, isAuthenticated ? undefined : sessionId)
          .catch(err => console.warn('[Cart] Failed to clear item from backend:', err));
      });

      return [];
    });
  };

  // Merge guest cart with user cart after login
  const mergeCart = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[Cart] Merging guest cart with user cart...');

      // Call backend merge endpoint
      const mergedCart = await cartService.mergeCart(sessionId);

      // Use new items array from backend
      if (mergedCart.items && Array.isArray(mergedCart.items)) {
        // Convert backend CartItemDto[] to frontend CartItem[] format
        const convertedItems: CartItem[] = mergedCart.items.map(item => ({
          product: {
            variantId: item.variantId,
            masterProductId: item.masterProductId,
            name: item.masterProductName,
            variantName: item.variantName,
            priceWithVat: item.priceWithVat,
            imageUrl: item.imageUrl,
            availabilityStatus: 'IN_STOCK' as const,
            stockQuantity: item.quantity,
            variantType: 'PHYSICAL_ONLY' as const
          },
          quantity: item.quantity,
          addedAt: Date.now()
        }));

        console.log('[Cart] Merged cart from backend:', convertedItems.length, 'items');
        setItems(convertedItems);

        // Clear guest session ID after successful merge
        localStorage.removeItem(SESSION_ID_KEY);

        return true;
      }

      return false;
    } catch (error) {
      console.error('[Cart] Failed to merge cart:', error);
      return false;
    }
  }, [sessionId]);

  // Listen for cart merge event from AuthProvider (after login)
  useEffect(() => {
    const handleCartMerge = () => {
      console.log('[Cart] Received cart:merge event');
      void mergeCart();
    };

    window.addEventListener('cart:merge', handleCartMerge);

    return () => {
      window.removeEventListener('cart:merge', handleCartMerge);
    };
  }, [mergeCart]);

  // Memoize totals
  const totals = useMemo(() => {
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = items.reduce((total, item) => total + (item.product.priceWithVat * item.quantity), 0);
    return { totalItems, totalPrice };
  }, [items]);

  const getTotalItems = () => totals.totalItems;
  const getTotalPrice = () => totals.totalPrice;

  // Provide the cart context to children components
  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      mergeCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook to use cart context
export const useCart = () => {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};