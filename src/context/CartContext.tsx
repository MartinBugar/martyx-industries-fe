import React, { useEffect, useMemo, useState, type ReactNode, useCallback } from 'react';
import type { Product } from '../data/productData';
import { CartContext, type CartItem } from './cartContextTypes';
import { cartService } from '../services/cartService';
import { useAuth } from './useAuth';

// Props for the CartProvider component
interface CartProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'martyx_cart_v1';
const SESSION_ID_KEY = 'martyx_session_id';

// Generate a unique session ID for guest users
function generateSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
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

type UnknownRecord = Record<string, unknown>;
function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}
function isCartItem(value: unknown): value is CartItem {
  if (!isRecord(value)) return false;
  const rec = value as UnknownRecord;
  return 'product' in rec && 'quantity' in rec && typeof rec['quantity'] === 'number';
}

function safeLoad(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Basic validation
    return parsed.filter(isCartItem);
  } catch (e) {
    console.warn('[Cart] Failed to load persisted cart:', e);
    return [];
  }
}

// CartProvider component to wrap the app and provide cart functionality
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => safeLoad());
  const [sessionId] = useState<string>(() => getSessionId());
  const [isSyncing, setIsSyncing] = useState(false);

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
        console.log('[Cart] Syncing with backend...');

        // For authenticated users, don't pass sessionId (backend uses JWT)
        // For guests, pass sessionId
        const backendCart = await cartService.getCart(
          isAuthenticated ? undefined : sessionId
        );

        // Parse cart_items JSON string to CartItem[]
        if (backendCart.cart_items) {
          try {
            const parsedItems = JSON.parse(backendCart.cart_items) as CartItem[];
            if (Array.isArray(parsedItems) && parsedItems.length > 0) {
              console.log('[Cart] Synced from backend:', parsedItems.length, 'items');
              setItems(parsedItems);
            }
          } catch (parseError) {
            console.warn('[Cart] Failed to parse backend cart_items:', parseError);
          }
        }
      } catch (error) {
        console.warn('[Cart] Failed to sync with backend, using localStorage:', error);
      } finally {
        setIsSyncing(false);
      }
    };

    // Only sync if not already syncing
    if (!isSyncing) {
      void syncWithBackend();
    }
  }, [isAuthenticated]); // Re-sync when auth state changes

  // Add a product to the cart
  const addToCart = (product: Product): 'added' | 'limit' => {
    let result: 'added' | 'limit' = 'added';
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.product.variantId === product.variantId);
      if (existingItemIndex >= 0) {
        const existingItem = prevItems[existingItemIndex];
        // If the variant is DIGITAL_ONLY, enforce max quantity of 1
        if (existingItem.product.variantType === 'DIGITAL_ONLY') {
          result = 'limit';
          return prevItems;
        }
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1
        };
        result = 'added';

        // Sync to backend (non-blocking)
        void cartService
          .addItem(product.variantId, 1, isAuthenticated ? undefined : sessionId)
          .catch(err => console.warn('[Cart] Failed to add to backend:', err));

        return updatedItems;
      } else {
        result = 'added';
        const updatedItems = [...prevItems, { product, quantity: 1 }];

        // Sync to backend (non-blocking)
        void cartService
          .addItem(product.variantId, 1, isAuthenticated ? undefined : sessionId)
          .catch(err => console.warn('[Cart] Failed to add to backend:', err));

        return updatedItems;
      }
    });
    return result;
  };

  // Remove a product from the cart by variant ID
  const removeFromCart = (variantId: string) => {
    setItems(prevItems => {
      const filtered = prevItems.filter(item => item.product.variantId.toString() !== variantId);

      // Sync to backend (non-blocking)
      const variantIdNum = parseInt(variantId, 10);
      if (!isNaN(variantIdNum)) {
        void cartService
          .removeItem(variantIdNum, isAuthenticated ? undefined : sessionId)
          .catch(err => console.warn('[Cart] Failed to remove from backend:', err));
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

        // Sync to backend (non-blocking)
        void cartService
          .updateQuantity(item.product.variantId, nextQty, isAuthenticated ? undefined : sessionId)
          .catch(err => console.warn('[Cart] Failed to update quantity in backend:', err));

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

      // Parse merged cart items
      if (mergedCart.cart_items) {
        try {
          const parsedItems = JSON.parse(mergedCart.cart_items) as CartItem[];
          if (Array.isArray(parsedItems)) {
            console.log('[Cart] Merged cart from backend:', parsedItems.length, 'items');
            setItems(parsedItems);

            // Clear guest session ID after successful merge
            localStorage.removeItem(SESSION_ID_KEY);

            return true;
          }
        } catch (parseError) {
          console.warn('[Cart] Failed to parse merged cart_items:', parseError);
        }
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