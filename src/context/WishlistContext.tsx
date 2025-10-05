import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { wishlistService } from '../services/wishlistService';
import { hybridProductService } from '../services/hybridProductService';
import { useAuth } from './useAuth';
import type { WishlistContextType, WishlistItem, WishlistStats } from '../types/wishlist';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [stats, setStats] = useState<WishlistStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setStats(null);
      setTotalCount(0);
      setLastUpdated(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const wishlistData = await wishlistService.getWishlist();
      
      // Automatically fix availability status by checking actual product status
      const correctedItems = await Promise.all(
        wishlistData.items.map(async (item) => {
          try {
            // Try to fetch the product to check if it's actually active
            await hybridProductService.getProductById(item.productId);
            // If we can fetch the product successfully, it means it's active
            return { ...item, isAvailable: true };
          } catch (error) {
            // If we can't fetch the product (inactive or not found), mark as unavailable
            if ((error as any).code === 'PRODUCT_INACTIVE') {
              return { ...item, isAvailable: false };
            }
            // For other errors (network, etc.), keep original status
            return item;
          }
        })
      );
      
      setItems(correctedItems);
      setTotalCount(wishlistData.totalCount);
      setLastUpdated(wishlistData.lastUpdated);
    } catch (err: any) {
      console.error('Failed to load wishlist:', err);

      // Handle authentication errors from backend
      if (err.message?.includes('Authentication required') || err.message?.includes('session has expired')) {
        setError('Please log in to access your wishlist');
      } else if (err.message?.includes('401') || err.errorData?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err.message?.includes('403') || err.errorData?.status === 403) {
        setError('You do not have permission to access this wishlist');
      } else if (err.message?.includes('5') || err.errorData?.status >= 500) {
        setError('Wishlist temporarily unavailable');
      } else {
        setError('Unable to load wishlist');
      }

      // Set empty state but don't block the UI
      setItems([]);
      setTotalCount(0);
      setLastUpdated(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadStats = useCallback(async () => {
    if (!isAuthenticated) {
      setStats(null);
      return;
    }

    try {
      const statsData = await wishlistService.getStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load wishlist stats:', err);
      // Stats are non-critical, fail silently
      setStats(null);
    }
  }, [isAuthenticated]);

  const addToWishlist = useCallback(async (productId: string | number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Please login to add items to wishlist');
      return false;
    }

    try {
      setError(null);
      const newItem = await wishlistService.addToWishlist(productId);
      
      // Fix availability status immediately by checking actual product status
      let correctedItem = newItem;
      try {
        await hybridProductService.getProductById(newItem.productId);
        // If we can fetch the product successfully, it means it's active
        correctedItem = { ...newItem, isAvailable: true };
      } catch (error) {
        // If we can't fetch the product (inactive or not found), mark as unavailable
        if ((error as any).code === 'PRODUCT_INACTIVE') {
          correctedItem = { ...newItem, isAvailable: false };
        }
        // For other errors (network, etc.), keep original status
      }
      
      setItems(prev => [correctedItem, ...prev]);
      setTotalCount(prev => prev + 1);
      setLastUpdated(new Date().toISOString());

      // Update stats optimistically
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          totalItems: prev.totalItems + 1,
          availableItems: correctedItem.isAvailable ? prev.availableItems + 1 : prev.availableItems,
          unavailableItems: !correctedItem.isAvailable ? prev.unavailableItems + 1 : prev.unavailableItems,
          totalValue: correctedItem.isAvailable ? prev.totalValue + correctedItem.productPrice : prev.totalValue
        } : null);
      }

      return true;
    } catch (err: any) {
      console.error('Failed to add to wishlist:', err);

      // Handle backend errors with proper error messages
      if (err.message?.includes('Authentication required') || err.message?.includes('session has expired')) {
        setError('Please log in to add items to wishlist');
      } else if (err.message?.includes('401') || err.errorData?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err.message?.includes('403') || err.errorData?.status === 403) {
        setError('You do not have permission to modify this wishlist');
      } else if (err.message?.includes('409') || err.errorData?.status === 409) {
        setError('Product is already in your wishlist');
      } else if (err.message?.includes('404') || err.errorData?.status === 404) {
        setError('Product not found');
      } else if (err.message?.includes('5') || err.errorData?.status >= 500) {
        setError('Server error, please try again');
      } else {
        setError('Unable to add to wishlist. Please try again.');
      }

      return false;
    }
  }, [isAuthenticated, stats]);

  const removeFromWishlist = useCallback(async (productId: string | number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Please login to remove items from wishlist');
      return false;
    }

    try {
      setError(null);

      // Convert productId to number for backend compatibility
      const numericId = typeof productId === 'string' ? parseInt(productId) : productId;
      const removedItem = items.find(item => item.productId === numericId);

      await wishlistService.removeFromWishlist(productId);

      setItems(prev => prev.filter(item => item.productId !== numericId));
      setTotalCount(prev => Math.max(0, prev - 1));
      setLastUpdated(new Date().toISOString());

      // Update stats optimistically
      if (stats && removedItem) {
        setStats(prev => prev ? {
          ...prev,
          totalItems: Math.max(0, prev.totalItems - 1),
          availableItems: removedItem.isAvailable ? Math.max(0, prev.availableItems - 1) : prev.availableItems,
          unavailableItems: !removedItem.isAvailable ? Math.max(0, prev.unavailableItems - 1) : prev.unavailableItems,
          totalValue: removedItem.isAvailable ? Math.max(0, prev.totalValue - removedItem.productPrice) : prev.totalValue
        } : null);
      }

      return true;
    } catch (err: any) {
      console.error('Failed to remove from wishlist:', err);

      // Handle backend errors with proper error messages
      if (err.message?.includes('Authentication required') || err.message?.includes('session has expired')) {
        setError('Please log in to remove items from wishlist');
      } else if (err.message?.includes('401') || err.errorData?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err.message?.includes('403') || err.errorData?.status === 403) {
        setError('You do not have permission to modify this wishlist');
      } else if (err.message?.includes('404') || err.errorData?.status === 404) {
        setError('Product not found in wishlist');
      } else if (err.message?.includes('5') || err.errorData?.status >= 500) {
        setError('Server error, please try again');
      } else {
        setError('Unable to remove from wishlist');
      }

      return false;
    }
  }, [isAuthenticated, items, stats]);

  const isInWishlist = useCallback((productId: string | number): boolean => {
    const numericId = typeof productId === 'string' ? parseInt(productId) : productId;
    return items.some(item => item.productId === numericId);
  }, [items]);

  const cleanupWishlist = useCallback(async (): Promise<number> => {
    if (!isAuthenticated) {
      throw new Error('Please login to cleanup wishlist');
    }

    try {
      setError(null);
      const removedCount = await wishlistService.cleanupWishlist();

      // Reload data after cleanup
      await loadWishlist();
      await loadStats();

      return removedCount;
    } catch (err) {
      console.error('Failed to cleanup wishlist:', err);
      setError('Failed to cleanup wishlist');
      throw err;
    }
  }, [isAuthenticated, loadWishlist, loadStats]);

  const addMultiple = useCallback(async (productIds: (string | number)[]): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to wishlist');
    }

    try {
      setError(null);
      await wishlistService.addMultiple(productIds);

      // Reload data after bulk operation
      await loadWishlist();
      await loadStats();
    } catch (err: any) {
      console.error('Failed to add multiple items to wishlist:', err);

      if (err.message?.includes('Authentication required') || err.message?.includes('session has expired')) {
        setError('Please log in to add items to wishlist');
      } else if (err.message?.includes('401') || err.errorData?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to add products to wishlist');
      }
      throw err;
    }
  }, [isAuthenticated, loadWishlist, loadStats]);

  const removeMultiple = useCallback(async (productIds: (string | number)[]): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error('Please login to remove items from wishlist');
    }

    try {
      setError(null);
      await wishlistService.removeMultiple(productIds);

      // Reload data after bulk operation
      await loadWishlist();
      await loadStats();
    } catch (err: any) {
      console.error('Failed to remove multiple items from wishlist:', err);

      if (err.message?.includes('Authentication required') || err.message?.includes('session has expired')) {
        setError('Please log in to remove items from wishlist');
      } else if (err.message?.includes('401') || err.errorData?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to remove products from wishlist');
      }
      throw err;
    }
  }, [isAuthenticated, loadWishlist, loadStats]);


  // Helper method to refresh both wishlist and stats
  const refreshWishlist = useCallback(async (): Promise<void> => {
    await Promise.all([loadWishlist(), loadStats()]);
  }, [loadWishlist, loadStats]);

  // Load wishlist when user authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
      loadStats();
    } else {
      setItems([]);
      setStats(null);
      setTotalCount(0);
      setLastUpdated(null);
      setError(null);
    }
  }, [isAuthenticated, loadWishlist, loadStats]);

  const contextValue: WishlistContextType = {
    items,
    stats,
    isLoading,
    error,
    totalCount,
    lastUpdated,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    loadWishlist,
    loadStats,
    cleanupWishlist,
    addMultiple,
    removeMultiple,
    clearError,
    refreshWishlist
  };

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

// Export for HMR compatibility
export default WishlistProvider;