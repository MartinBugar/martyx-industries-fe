'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface WishlistItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  imageUrl?: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  error: string | null;
  clearError: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addItem = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.productId === item.productId)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return items.some((i) => i.productId === productId);
  }, [items]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Alias methods for compatibility
  const addToWishlist = addItem;
  const removeFromWishlist = removeItem;

  return (
    <WishlistContext.Provider value={{
      items,
      addItem,
      removeItem,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      isInWishlist,
      error,
      clearError
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
