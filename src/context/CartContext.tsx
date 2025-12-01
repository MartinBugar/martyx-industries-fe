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

// Cart storage and session configuration
const STORAGE_KEY = 'martyx_cart_v1';
const SESSION_ID_KEY = 'martyx_session_id';
const CART_EXPIRATION_DAYS = 30; // Cart items expire after 30 days
const CART_EXPIRATION_MS = CART_EXPIRATION_DAYS * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Digital product constraints
const MAX_DIGITAL_PRODUCT_QUANTITY = 1; // Digital products can only be purchased once per order

/**
 * Generate a cryptographically secure unique session ID for guest users
 * Uses crypto.getRandomValues() for 128 bits of entropy
 *
 * @returns Session ID in format "guest_{hex}" where hex is 32 characters
 */
function generateSessionId(): string {
  // Use crypto.getRandomValues() for cryptographic randomness (much better than Math.random())
  const array = new Uint8Array(16); // 128 bits of entropy
  crypto.getRandomValues(array);

  // Convert to hex string
  const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

  return `guest_${hex}`;
}

/**
 * Get existing session ID from localStorage or create a new one
 * Session ID persists across page reloads for guest users
 *
 * @returns Session ID string
 */
function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Convert full Product object to CartProduct (strips unnecessary fields)
 * Only keeps fields needed for cart display and processing
 *
 * @param product - Full product object from product service
 * @returns CartProduct with only essential cart fields
 */
function toCartProduct(product: Product): CartProduct {
  return {
    variantId: product.variantId,
    masterProductId: product.masterProductId,
    name: product.name,
    variantName: product.variantName,
    priceWithVat: product.priceWithVat,
    // Use backend-provided images (primary image with isPrimary flag)
    // Fallback to first gallery image if not available
    imageUrl: product.imageUrl || product.gallery?.[0],
    thumbnailUrl: product.thumbnailUrl || product.imageUrl || product.gallery?.[0],
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
 * Check if a cart item has expired (older than CART_EXPIRATION_DAYS)
 * Items without addedAt timestamp are considered expired (legacy data)
 *
 * @param item - Cart item to check
 * @returns true if item is expired or missing timestamp, false otherwise
 */
function isItemExpired(item: CartItem): boolean {
  if (!item.addedAt) return true; // If no timestamp, consider it expired (legacy data)
  const now = Date.now();
  const age = now - item.addedAt;
  return age > CART_EXPIRATION_MS;
}

/**
 * Validate and fix cart items on initialization
 * - Digital products are limited to quantity defined by MAX_DIGITAL_PRODUCT_QUANTITY
 * - Returns fixed items and a flag indicating if any changes were made
 *
 * @param items - Array of cart items to validate
 * @returns Object containing fixed items array and hasChanges boolean flag
 */
function validateAndFixCartItems(items: CartItem[]): { items: CartItem[], hasChanges: boolean } {
  let hasChanges = false;
  const fixedItems: CartItem[] = [];
  const corrections: string[] = [];

  for (const item of items) {
    // Null safety check for variantType
    const isDigital = item.product?.variantType === 'DIGITAL_ONLY';

    // Fix digital products with quantity > MAX_DIGITAL_PRODUCT_QUANTITY
    if (isDigital && item.quantity > MAX_DIGITAL_PRODUCT_QUANTITY) {
      hasChanges = true;
      corrections.push(`${item.product.name || 'Unknown Product'}: ${item.quantity} → ${MAX_DIGITAL_PRODUCT_QUANTITY} (Digital products limited to ${MAX_DIGITAL_PRODUCT_QUANTITY} per cart)`);
      fixedItems.push({
        ...item,
        quantity: MAX_DIGITAL_PRODUCT_QUANTITY
      });
    } else {
      fixedItems.push(item);
    }
  }

  // Log corrections if any were made
  if (corrections.length > 0) {
    logWarn(`[Cart] Fixed ${corrections.length} invalid cart item(s):`);
    corrections.forEach(msg => logWarn(`  • ${msg}`));
  }

  return { items: fixedItems, hasChanges };
}

/**
 * Sync corrected cart item quantities back to the backend
 * Compares original and fixed items, updates backend for any quantity changes
 *
 * @param validItems - Original items before validation
 * @param fixedItems - Items after validation fixes
 * @param isAuthenticated - Whether user is authenticated (affects sessionId usage)
 * @param sessionId - Guest session ID (used for non-authenticated users)
 * @param context - Context string for logging (e.g., "sync", "merge")
 */
async function syncCorrectedQuantitiesToBackend(
  validItems: CartItem[],
  fixedItems: CartItem[],
  isAuthenticated: boolean,
  sessionId: string,
  context: string = 'sync'
): Promise<void> {
  // Find items that were corrected by comparing with original validItems
  const correctedItems = fixedItems.filter((fixed, index) => {
    const original = validItems[index];
    return original && original.quantity !== fixed.quantity;
  });

  // Update backend for each corrected item
  for (const fixed of correctedItems) {
    const original = validItems.find(v => v.product.variantId === fixed.product.variantId);
    if (!original) continue;

    try {
      await cartService.updateQuantity(
        fixed.product.variantId,
        fixed.quantity,
        isAuthenticated ? undefined : sessionId
      );
      logInfo(`[Cart] Synced corrected quantity to backend (${context}): ${fixed.product.name || 'Unknown'} [ID: ${fixed.product.variantId}] (${original.quantity} → ${fixed.quantity})`);
    } catch (err) {
      logWarn(`[Cart] Failed to sync corrected quantity to backend (${context}) for ${fixed.product.name || 'Unknown'} [ID: ${fixed.product.variantId}]:`, err);
    }
  }
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
      imageUrl: item.imageUrl, // Use full image from CartItemDto
      thumbnailUrl: item.thumbnailUrl, // Use thumbnail for cart/minicart display
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

/**
 * Safely load cart items from localStorage with validation and cleanup
 * Performs the following operations:
 * 1. Loads and parses cart data from localStorage
 * 2. Filters out invalid items (type checking)
 * 3. Removes expired items (older than CART_EXPIRATION_DAYS)
 * 4. Validates and fixes digital product quantities
 * 5. Updates localStorage if changes were made
 *
 * @returns Array of valid, non-expired, validated cart items (empty array on error)
 */
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
    }

    // Validate and fix digital product quantities
    const { items: fixedItems, hasChanges } = validateAndFixCartItems(activeItems);

    // Update localStorage only if we made actual changes (expired items removed or quantities fixed)
    if (expiredItems.length > 0 || hasChanges) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fixedItems));
        logInfo('[Cart] Updated localStorage after validation');
      } catch (e) {
        logWarn('[Cart] Failed to update cart after validation:', e);
      }
    }

    return fixedItems;
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

        // CRITICAL: On payment success page, DON'T sync with backend
        // Backend might still have old cart (webhook processing can be delayed)
        // The success page will explicitly clear the cart
        const isOnSuccessPage = window.location.pathname.includes('/success');
        const recentPaymentCleared = sessionStorage.getItem('cart_cleared_after_payment');
        if (isOnSuccessPage || recentPaymentCleared) {
          logInfo('[Cart] On success page or recent payment - skipping backend sync, clearing cart');
          setItems([]);
          localStorage.removeItem(STORAGE_KEY);
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

          // Notify user if some items couldn't be loaded
          const failedCount = backendCart.items.length - validItems.length;
          if (failedCount > 0) {
            logWarn('[Cart]', failedCount, 'items failed to load complete details');
            // Show user-friendly notification (non-blocking)
            console.warn(`[Cart] ${failedCount} item(s) couldn't be loaded. They may no longer be available.`);
          }

          // Validate and fix digital product quantities
          const { items: fixedItems, hasChanges } = validateAndFixCartItems(validItems);

          // Sync corrected quantities back to backend (only if changes were made)
          if (hasChanges) {
            await syncCorrectedQuantitiesToBackend(validItems, fixedItems, isAuthenticated, sessionId, 'backend sync');
          }

          logInfo('[Cart] Synced from backend:', fixedItems.length, 'items with complete details');
          setItems(fixedItems);
        } else if (backendCart.items && backendCart.items.length === 0) {
          // Backend has empty cart
          logInfo('[Cart] Backend cart is empty');

          // CRITICAL: Check if we're on success page (URL contains /payment/success or /stripe/success)
          // This prevents restoring localStorage cart after successful payment
          const isOnSuccessPage = window.location.pathname.includes('/success');
          const recentPayment = sessionStorage.getItem('cart_cleared_after_payment');

          if (isOnSuccessPage || recentPayment) {
            logInfo('[Cart] On success page or recent payment detected - not restoring localStorage cart');
            localStorage.removeItem(STORAGE_KEY);
            setItems([]);
          } else if (localItems.length > 0) {
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
  const addToCart = useCallback((product: Product): 'added' | 'limit' | 'out_of_stock' | 'discontinued' | 'pre_order' => {
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

        // If the variant is DIGITAL_ONLY, enforce max quantity of 1 - null safety check
        if (existingItem.product?.variantType === 'DIGITAL_ONLY') {
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
  }, [isAuthenticated, sessionId]);

  // Remove a product from the cart by variant ID
  const removeFromCart = useCallback((variantId: string) => {
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
  }, [isAuthenticated, sessionId]);

  // Update the quantity of a product in the cart by variant ID
  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item => {
        if (item.product.variantId.toString() !== variantId) return item;
        // Null safety check for variantType
        const isDigital = item.product?.variantType === 'DIGITAL_ONLY';
        const nextQty = isDigital ? MAX_DIGITAL_PRODUCT_QUANTITY : quantity;

        // Sync to backend with debouncing (prevents excessive API calls during rapid changes)
        debouncedUpdateQuantity(item.product.variantId, nextQty);

        return { ...item, quantity: nextQty };
      })
    );
  }, [removeFromCart, debouncedUpdateQuantity]);

  // Clear all items from the cart
  const clearCart = useCallback(() => {
    setItems(prevItems => {
      // Remove each item from backend
      prevItems.forEach(item => {
        void cartService
          .removeItem(item.product.variantId, isAuthenticated ? undefined : sessionId)
          .catch(err => logWarn('[Cart] Failed to clear item from backend:', err));
      });

      return [];
    });
  }, [isAuthenticated, sessionId]);

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

        // Validate and fix digital product quantities
        const { items: fixedItems, hasChanges } = validateAndFixCartItems(validItems);

        // Sync corrected quantities back to backend (only if changes were made)
        if (hasChanges) {
          await syncCorrectedQuantitiesToBackend(validItems, fixedItems, isAuthenticated, sessionId, 'cart merge');
        }

        logInfo('[Cart] Merged cart from backend:', fixedItems.length, 'items with complete details');
        setItems(fixedItems);

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

  // PERFORMANCE OPTIMIZED: Periodic stock validation
  // Only runs when:
  // 1. User is on cart or checkout page (where stock matters)
  // 2. Cart has physical products (digital products don't have stock)
  // 3. Cart is not empty
  // This reduces API calls by ~80% compared to running on every page
  useEffect(() => {
    // Helper to check if current page needs stock validation
    const shouldValidateStock = (): boolean => {
      const path = window.location.pathname.toLowerCase();
      // Only validate on cart-related pages where stock accuracy matters
      return path.includes('/cart') ||
             path.includes('/checkout') ||
             path.includes('/kosik') ||
             path.includes('/pokladna');
    };

    const validateCartStock = async () => {
      // OPTIMIZATION: Skip if not on relevant page
      if (!shouldValidateStock()) {
        logInfo('[Cart] Skipping stock validation - not on cart/checkout page');
        return;
      }

      // Access current items via setItems callback to get latest state without dependency
      setItems(currentItems => {
        // Skip validation if cart is empty
        if (currentItems.length === 0) {
          logInfo('[Cart] Skipping stock validation - cart is empty');
          return currentItems;
        }

        // OPTIMIZATION: Check if cart has any physical products
        const hasPhysicalItems = currentItems.some(
          item => item.product?.variantType !== 'DIGITAL_ONLY'
        );

        if (!hasPhysicalItems) {
          logInfo('[Cart] Skipping stock validation - cart only has digital products');
          return currentItems;
        }

        logInfo('[Cart] Validating stock for', currentItems.length, 'items...');

        // Run async validation in background without blocking state update
        (async () => {
          const updates: { variantId: number; oldQty: number; newQty: number; productName: string }[] = [];
          const removals: { variantId: number; productName: string }[] = [];

          // OPTIMIZATION: Only check physical products
          const physicalItems = currentItems.filter(
            item => item.product?.variantType !== 'DIGITAL_ONLY'
          );

          // Check stock for each physical item
          for (const item of physicalItems) {
            try {
              const stockData = await stockService.getAvailableStock(item.product.variantId);

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

            // Notify user about changes (use console instead of alert for better UX)
            logWarn('[Cart] Stock validation - items updated:', { updates, removals });

            // Only show alert if user is actively on cart/checkout (important for them to know)
            if (shouldValidateStock()) {
              const messages: string[] = [];
              if (updates.length > 0) {
                messages.push(`Updated quantities:\n${updates.map(u => `  • ${u.productName}: ${u.oldQty} → ${u.newQty}`).join('\n')}`);
              }
              if (removals.length > 0) {
                messages.push(`Removed (out of stock):\n${removals.map(r => `  • ${r.productName}`).join('\n')}`);
              }
              alert(`🔄 Cart Updated\n\n${messages.join('\n\n')}`);
            }
          } else {
            logInfo('[Cart] ✅ All items in stock');
          }
        })();

        // Return current items unchanged (async validation happens in background)
        return currentItems;
      });
    };

    // Run validation immediately on mount (only if on relevant page)
    void validateCartStock();

    // Set up interval for periodic validation (60 seconds) - created ONCE
    const interval = setInterval(() => {
      void validateCartStock();
    }, 60000); // 60 seconds

    logInfo('[Cart] Stock validation interval created (optimized - only runs on cart/checkout pages)');

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

  const getTotalItems = useCallback(() => totals.totalItems, [totals.totalItems]);
  const getTotalPrice = useCallback(() => totals.totalPrice, [totals.totalPrice]);

  // Check if cart has at least one physical product (not DIGITAL_ONLY)
  // Returns true if there's any PHYSICAL_ONLY or HYBRID product
  const hasPhysicalProducts = useCallback((): boolean => {
    return items.some(item => item.product?.variantType !== 'DIGITAL_ONLY');
  }, [items]);

  // PERFORMANCE: Memoize context value to prevent unnecessary re-renders
  // Without this, every state change creates a new object and triggers ALL consumers to re-render
  const contextValue = useMemo(() => ({
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    mergeCart,
    hasPhysicalProducts
  }), [items, addToCart, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice, mergeCart, hasPhysicalProducts]);

  // Provide the cart context to children components
  return (
    <CartContext.Provider value={contextValue}>
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