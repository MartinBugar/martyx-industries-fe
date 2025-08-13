import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '../data/productData';
import { CartContext, type CartItem } from './cartContextTypes';

// Props for the CartProvider component
interface CartProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'martyx_cart_v1';

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
  const [items, setItems] = useState<CartItem[]>(() => safeLoad());

  // Persist to localStorage for offline support
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('[Cart] Failed to persist cart:', e);
    }
  }, [items]);

  // Add a product to the cart
  const addToCart = (product: Product): 'added' | 'limit' => {
    let result: 'added' | 'limit' = 'added';
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.product.id === product.id);
      if (existingItemIndex >= 0) {
        const existingItem = prevItems[existingItemIndex];
        // If the product is DIGITAL, enforce max quantity of 1
        if (existingItem.product.productType === 'DIGITAL') {
          result = 'limit';
          return prevItems;
        }
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1
        };
        result = 'added';
        return updatedItems;
      } else {
        result = 'added';
        return [...prevItems, { product, quantity: 1 }];
      }
    });
    return result;
  };

  // Remove a product from the cart
  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  // Update the quantity of a product in the cart
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prevItems => 
      prevItems.map(item => {
        if (item.product.id !== productId) return item;
        const isDigital = item.product.productType === 'DIGITAL';
        const nextQty = isDigital ? 1 : quantity;
        return { ...item, quantity: nextQty };
      })
    );
  };

  // Clear all items from the cart
  const clearCart = () => {
    setItems([]);
  };

  // Memoize totals
  const totals = useMemo(() => {
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
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
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};