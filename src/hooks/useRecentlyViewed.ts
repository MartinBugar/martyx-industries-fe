import { useState, useEffect, useCallback } from 'react';
import { logInfo, logWarn } from '../services/logger';

const STORAGE_KEY = 'martyx_recently_viewed';
const MAX_ITEMS = 10;
const MAX_AGE_DAYS = 30;

export interface RecentlyViewedItem {
  productId: number;
  viewedAt: number;
}

interface StoredData {
  items: RecentlyViewedItem[];
  version: number;
}

const CURRENT_VERSION = 1;

/**
 * Hook for tracking and retrieving recently viewed products
 *
 * Features:
 * - Stores up to 10 most recently viewed products
 * - Auto-expires items older than 30 days
 * - Prevents duplicates (moves to front if already viewed)
 * - Persists across sessions via localStorage
 */
export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const parsed: StoredData = JSON.parse(stored);

      // Version check
      if (parsed.version !== CURRENT_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // Filter out expired items
      const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const validItems = parsed.items.filter(
        item => now - item.viewedAt < maxAgeMs
      );

      setRecentlyViewed(validItems);

      // Save filtered list if items were removed
      if (validItems.length !== parsed.items.length) {
        saveToStorage(validItems);
      }
    } catch (error) {
      logWarn('[RecentlyViewed] Failed to load:', error);
    }
  }, []);

  // Save to localStorage
  const saveToStorage = (items: RecentlyViewedItem[]) => {
    try {
      const data: StoredData = {
        items,
        version: CURRENT_VERSION
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      logWarn('[RecentlyViewed] Failed to save:', error);
    }
  };

  // Add a product to recently viewed
  const addProduct = useCallback((productId: number) => {
    setRecentlyViewed(prev => {
      // Remove if already exists (will be re-added at front)
      const filtered = prev.filter(item => item.productId !== productId);

      // Add to front
      const newItem: RecentlyViewedItem = {
        productId,
        viewedAt: Date.now()
      };

      // Keep only MAX_ITEMS
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);

      // Save to storage
      saveToStorage(updated);
      logInfo(`[RecentlyViewed] Added product ${productId}`);

      return updated;
    });
  }, []);

  // Remove a product from recently viewed
  const removeProduct = useCallback((productId: number) => {
    setRecentlyViewed(prev => {
      const updated = prev.filter(item => item.productId !== productId);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  // Clear all recently viewed
  const clearAll = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
    logInfo('[RecentlyViewed] Cleared all');
  }, []);

  // Get product IDs only (for API calls)
  const getProductIds = useCallback((): number[] => {
    return recentlyViewed.map(item => item.productId);
  }, [recentlyViewed]);

  return {
    /** List of recently viewed items with timestamps */
    recentlyViewed,
    /** Product IDs only */
    productIds: getProductIds(),
    /** Add a product to recently viewed */
    addProduct,
    /** Remove a specific product */
    removeProduct,
    /** Clear all recently viewed */
    clearAll,
    /** Number of items */
    count: recentlyViewed.length
  };
}

export default useRecentlyViewed;
