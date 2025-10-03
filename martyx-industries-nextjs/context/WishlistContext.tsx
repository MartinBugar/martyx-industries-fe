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
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

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

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, clearWishlist, isInWishlist }}>
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
