import React, { useEffect, useMemo, useState, type ReactNode, useCallback } from 'react';
import type { Product } from '../data/productData';
import { CartContext, type CartItem, type CartProduct } from './cartContextTypes';
import { cartService } from '../services/cartService';
import { productService } from '../services/productService';
import type { CartItemDto } from '../types/customer';
import { useAuth } from './useAuth';
import { trackAddToCart, trackRemoveFromCart } from '../services/analyticsService';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { stockService } from '../services/stockService';
import { logInfo, logWarn, logError } from '../services/logger';

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

/**
 * Convert backend CartItemDto to frontend CartItem with complete product details
 * Fetches full product variant data to populate all required fields
 */
async function convertCartItemDto(item: CartItemDto): Promise<CartItem | null> {
  try {
    // Fetch full product variant details from backend
    const variant = await productService.getVariant(item.variantId);

    // Create complete CartProduct with all fields from ProductVariantDto
    const product: CartProduct = {
      variantId: variant.id,
      masterProductId: variant.masterProductId,
      name: item.masterProductName, // Use master product name from CartItemDto
      variantName: variant.variantName,
      priceWithVat: variant.priceWithVat,
      imageUrl: item.imageUrl, // Use image from CartItemDto
      availabilityStatus: variant.availabilityStatus,
      stockQuantity: variant.stockQuantity,
      variantType: variant.variantType,
      sku: variant.sku,
      gallery: item.imageUrl ? [item.imageUrl] : [], // Create gallery array from imageUrl
      currency: variant.currency,
      requiresShipping: variant.requiresShipping,
      vatRate: variant.vatRate,
      weightKg: variant.weightGrams ? variant.weightGrams / 1000 : undefined, // Convert grams to kg
    };

    return {
      product,
      quantity: item.quantity,
      addedAt: Date.now(),
    };
  } catch (error) {
    logError('[Cart] Failed to fetch product details for variant', item.variantId, ':', error);
    return null;
  }
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
      logInfo(`[Cart] Removed ${expiredItems.length} expired item(s) (older than ${CART_EXPIRATION_DAYS} days)`);
      expiredItems.forEach(item => {
        const daysOld = Math.floor((Date.now() - item.addedAt) / (24 * 60 * 60 * 1000));
        logInfo(`[Cart] Expired: ${item.product.name} (${daysOld} days old)`);
      });

      // Update localStorage with only active items
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeItems));
      } catch (e) {
        logWarn('[Cart] Failed to update cart after removing expired items:', e);
      }
    }

    return activeItems;
  } catch (e) {
    logWarn('[Cart] Failed to load persisted cart:', e);
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
      logInfo('[Cart] Payment in progress detected - clearing localStorage and initializing with empty cart');
      // Clear localStorage immediately to prevent any re-sync attempts
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        logWarn('[Cart] Failed to clear localStorage:', e);
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
        .catch(err => logWarn('[Cart] Failed to update quantity in backend:', err));
    },
    500
  );

  // Persist to localStorage for offline support
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      logWarn('[Cart] Failed to persist cart:', e);
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
          logInfo('[Cart] Payment in progress - clearing local cart state and waiting for StripeSuccess');
          // Clear items from state immediately to prevent re-sync
          setItems([]);
          // Don't clear the flag yet - StripeSuccess will handle it
          setIsSyncing(false);
          return;
        }

        logInfo('[Cart] Syncing with backend...');

        // Get current localStorage cart
        const localItems = safeLoad();

        // For authenticated users, don't pass sessionId (backend uses JWT)
        // For guests, pass sessionId
        const backendCart = await cartService.getCart(
          isAuthenticated ? undefined : sessionId
        );

        // Use new items array from backend (CartItemDto[])
        if (backendCart.items && Array.isArray(backendCart.items) && backendCart.items.length > 0) {
          // Fetch complete product details for each cart item
          logInfo('[Cart] Fetching complete product details for', backendCart.items.length, 'items...');
          const itemPromises = backendCart.items.map(item => convertCartItemDto(item));
          const convertedItems = await Promise.all(itemPromises);

          // Filter out any items that failed to load (null results)
          const validItems = convertedItems.filter((item): item is CartItem => item !== null);

          if (validItems.length < backendCart.items.length) {
            logWarn('[Cart]', backendCart.items.length - validItems.length, 'items failed to load complete details');
          }

          logInfo('[Cart] Synced from backend:', validItems.length, 'items with complete details');
          setItems(validItems);
        } else if (backendCart.items && backendCart.items.length === 0) {
          // Backend has empty cart
          logInfo('[Cart] Backend cart is empty');

          if (localItems.length > 0) {
            // localStorage has items - push them to backend
            // This handles offline cart recovery
            logInfo('[Cart] No cart in backend, but localStorage has', localItems.length, 'items. Syncing localStorage → backend...');
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
                  logWarn('[Cart] Failed to sync item to backend:', addErr);
                }
              }
            }
            logInfo('[Cart] Successfully synced localStorage cart to backend');
          } else {
            // Both backend and localStorage are empty
            logInfo('[Cart] No cart in backend and localStorage is empty');
            setItems([]);
          }
        }
      } catch (error) {
        logWarn('[Cart] Failed to sync with backend, using localStorage:', error);
        // If backend fails, keep localStorage cart
        const localItems = safeLoad();
        if (localItems.length > 0) {
          logInfo('[Cart] Using localStorage cart with', localItems.length, 'items');
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
      logWarn('[Cart] Product is out of stock:', product.name);
      return 'out_of_stock';
    }

    if (product.availabilityStatus === 'DISCONTINUED') {
      logWarn('[Cart] Product is discontinued:', product.name);
      return 'discontinued';
    }

    // Digital products can be sold even when stock is 0 (they don't deplete)
    const isDigitalProduct = product.variantType === 'DIGITAL_ONLY';

    // For physical products, check stock quantity
    if (!isDigitalProduct && product.stockQuantity <= 0) {
      logWarn('[Cart] Product stock is 0:', product.name, 'Stock:', product.stockQuantity);
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
          logWarn('[Cart] Cannot add more items. Stock limit reached:', product.stockQuantity);
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
              logInfo('[Cart] Item already being added, ignoring duplicate request');
            } else {
              logWarn('[Cart] Failed to add to backend:', err);
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
              logInfo('[Cart] Item already being added, ignoring duplicate request');
            } else {
              logWarn('[Cart] Failed to add to backend:', err);
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
          .catch(err => logWarn('[Cart] Failed to remove from backend:', err));
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
          .catch(err => logWarn('[Cart] Failed to clear item from backend:', err));
      });

      return [];
    });
  };

  // Merge guest cart with user cart after login
  const mergeCart = useCallback(async (): Promise<boolean> => {
    try {
      logInfo('[Cart] Merging guest cart with user cart...');

      // Call backend merge endpoint
      const mergedCart = await cartService.mergeCart(sessionId);

      // Use new items array from backend
      if (mergedCart.items && Array.isArray(mergedCart.items)) {
        // Fetch complete product details for each merged cart item
        logInfo('[Cart] Fetching complete product details for', mergedCart.items.length, 'merged items...');
        const itemPromises = mergedCart.items.map(item => convertCartItemDto(item));
        const convertedItems = await Promise.all(itemPromises);

        // Filter out any items that failed to load
        const validItems = convertedItems.filter((item): item is CartItem => item !== null);

        if (validItems.length < mergedCart.items.length) {
          logWarn('[Cart]', mergedCart.items.length - validItems.length, 'merged items failed to load complete details');
        }

        logInfo('[Cart] Merged cart from backend:', validItems.length, 'items with complete details');
        setItems(validItems);

        // Clear guest session ID after successful merge
        localStorage.removeItem(SESSION_ID_KEY);

        return true;
      }

      return false;
    } catch (error) {
      logError('[Cart] Failed to merge cart:', error);
      return false;
    }
  }, [sessionId]);

  // Listen for cart merge event from AuthProvider (after login)
  useEffect(() => {
    const handleCartMerge = () => {
      logInfo('[Cart] Received cart:merge event');
      void mergeCart();
    };

    window.addEventListener('cart:merge', handleCartMerge);

    return () => {
      window.removeEventListener('cart:merge', handleCartMerge);
    };
  }, [mergeCart]);

  // Periodic stock validation (every 60 seconds)
  // Fixed: Interval is created ONCE on mount to prevent interval stacking
  useEffect(() => {
    const validateCartStock = async () => {
      // Access current items via setItems callback to get latest state without dependency
      setItems(currentItems => {
        // Skip validation if cart is empty
        if (currentItems.length === 0) {
          logInfo('[Cart] Skipping stock validation - cart is empty');
          return currentItems;
        }

        logInfo('[Cart] Validating stock for', currentItems.length, 'items...');

        // Run async validation in background without blocking state update
        (async () => {
          const updates: { variantId: number; oldQty: number; newQty: number; productName: string }[] = [];
          const removals: { variantId: number; productName: string }[] = [];

          // Check stock for each item
          for (const item of currentItems) {
            try {
              const stockData = await stockService.getAvailableStock(item.product.variantId);

              // Skip digital products (they don't have stock constraints)
              if (item.product.variantType === 'DIGITAL_ONLY') continue;

              // If item quantity exceeds available stock
              if (item.quantity > stockData.availableStock) {
                if (stockData.availableStock > 0) {
                  // Reduce quantity to match available stock
                  updates.push({
                    variantId: item.product.variantId,
                    oldQty: item.quantity,
                    newQty: stockData.availableStock,
                    productName: item.product.name
                  });
                } else {
                  // No stock available - mark for removal
                  removals.push({
                    variantId: item.product.variantId,
                    productName: item.product.name
                  });
                }
              }
            } catch (error) {
              logError(`[Cart] Failed to validate stock for variant ${item.product.variantId}:`, error);
            }
          }

          // Apply updates and removals
          if (updates.length > 0 || removals.length > 0) {
            setItems(prevItems => {
              let updatedItems = [...prevItems];

              // Update quantities
              for (const update of updates) {
                const index = updatedItems.findIndex(i => i.product.variantId === update.variantId);
                if (index >= 0) {
                  updatedItems[index] = {
                    ...updatedItems[index],
                    quantity: update.newQty
                  };

                  // Sync to backend
                  void cartService
                    .updateQuantity(update.variantId, update.newQty, isAuthenticated ? undefined : sessionId)
                    .catch(err => logWarn('[Cart] Failed to update quantity in backend:', err));
                }
              }

              // Remove out-of-stock items
              for (const removal of removals) {
                updatedItems = updatedItems.filter(i => i.product.variantId !== removal.variantId);

                // Sync to backend
                void cartService
                  .removeItem(removal.variantId, isAuthenticated ? undefined : sessionId)
                  .catch(err => logWarn('[Cart] Failed to remove item from backend:', err));
              }

              return updatedItems;
            });

            // Notify user about changes
            const messages: string[] = [];
            if (updates.length > 0) {
              messages.push(`Updated quantities:\n${updates.map(u => `  • ${u.productName}: ${u.oldQty} → ${u.newQty}`).join('\n')}`);
            }
            if (removals.length > 0) {
              messages.push(`Removed (out of stock):\n${removals.map(r => `  • ${r.productName}`).join('\n')}`);
            }

            alert(`🔄 Cart Updated\n\n${messages.join('\n\n')}`);
            logWarn('[Cart] Stock validation completed:', { updates, removals });
          } else {
            logInfo('[Cart] ✅ All items in stock');
          }
        })();

        // Return current items unchanged (async validation happens in background)
        return currentItems;
      });
    };

    // Run validation immediately on mount
    void validateCartStock();

    // Set up interval for periodic validation (60 seconds) - created ONCE
    const interval = setInterval(() => {
      void validateCartStock();
    }, 60000); // 60 seconds

    logInfo('[Cart] Stock validation interval created');

    return () => {
      clearInterval(interval);
      logInfo('[Cart] Stock validation interval cleared');
    };
  }, [isAuthenticated, sessionId]); // Removed 'items' from dependencies to prevent interval recreation

  // Memoize totals
  const totals = useMemo(() => {
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = items.reduce((total, item) => total + (item.product.priceWithVat * item.quantity), 0);
    return { totalItems, totalPrice };
  }, [items]);

  const getTotalItems = () => totals.totalItems;
  const getTotalPrice = () => totals.totalPrice;

  // Check if cart has at least one physical product (not DIGITAL_ONLY)
  // Returns true if there's any PHYSICAL_ONLY or HYBRID product
  const hasPhysicalProducts = useCallback((): boolean => {
    return items.some(item => item.product.variantType !== 'DIGITAL_ONLY');
  }, [items]);

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
      mergeCart,
      hasPhysicalProducts
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