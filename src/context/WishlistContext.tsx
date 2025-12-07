import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { wishlistService } from '../services/wishlistService';
import { hybridProductService } from '../services/hybridProductService';
import { useAuth } from './useAuth';
import type { WishlistContextType, WishlistItem, WishlistStats, WishlistConfigurationOption } from '../types/wishlist';
import { logError } from '../services/logger';
import { triggerHaptic } from '../hooks/useHapticFeedback';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

interface WishlistProviderProps {
  children: ReactNode;
}

// Type guard for errors with code property
interface ErrorWithCode {
  code?: string;
}

// Type guard for errors with message and errorData
interface ErrorWithData {
  message?: string;
  errorData?: {
    status?: number;
  };
}

const isErrorWithCode = (error: unknown): error is ErrorWithCode => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

const isErrorWithData = (error: unknown): error is ErrorWithData => {
  return typeof error === 'object' && error !== null;
};

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
            if (isErrorWithCode(error) && error.code === 'PRODUCT_INACTIVE') {
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
    } catch (err: unknown) {
      logError('Failed to load wishlist:', err);

      // Handle authentication errors from backend
      if (isErrorWithData(err)) {
        if (err.message?.includes('Authentication required') || err.message?.includes('session has expired')) {
          setError('Please log in to access your wishlist');
        } else if (err.message?.includes('401') || err.errorData?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (err.message?.includes('403') || err.errorData?.status === 403) {
          setError('You do not have permission to access this wishlist');
        } else if (err.message?.includes('5') || (err.errorData?.status !== undefined && err.errorData.status >= 500)) {
          setError('Wishlist temporarily unavailable');
        } else {
          setError('Unable to load wishlist');
        }
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
    } catch (err: unknown) {
      logError('Failed to load wishlist stats:', err);
      // Stats are non-critical, fail silently
      setStats(null);
    }
  }, [isAuthenticated]);

  const addToWishlist = useCallback(async (
    productId: string | number,
    configuration?: Record<string, WishlistConfigurationOption>,
    configurationPriceModifier?: number
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Please login to add items to wishlist');
      return false;
    }

    const numericId = typeof productId === 'string' ? parseInt(productId) : productId;

    // Check if already in wishlist
    if (!configuration) {
      // For non-configured products, check if any non-configured entry exists
      if (items.some(item => item.productId === numericId && !item.configuration)) {
        setError('Product is already in your wishlist');
        return false;
      }
    } else {
      // For configured products, check if identical configuration exists
      const configJson = JSON.stringify(configuration);
      if (items.some(item =>
        item.productId === numericId &&
        item.configuration &&
        JSON.stringify(item.configuration) === configJson
      )) {
        setError('This configuration is already in your wishlist');
        return false;
      }
    }

    // Store previous state for rollback
    const previousItems = items;
    const previousStats = stats;
    const previousTotalCount = totalCount;

    // Create optimistic item placeholder with all required fields
    const optimisticItem: WishlistItem = {
      id: -Date.now(), // Temporary negative ID
      productId: numericId,
      productName: 'Loading...',
      productDescription: '',
      productPrice: 0,
      productCurrency: 'EUR',
      productImageUrl: '',
      productType: 'physical',
      isAvailable: true,
      hasMultipleVariants: false,
      addedAt: new Date().toISOString(),
      // Include configuration if provided
      configuration,
      configurationPriceModifier: configurationPriceModifier ?? 0,
      effectivePrice: configurationPriceModifier ?? 0
    };

    // OPTIMISTIC UPDATE: Update UI immediately
    setError(null);
    setItems(prev => [optimisticItem, ...prev]);
    setTotalCount(prev => prev + 1);
    setLastUpdated(new Date().toISOString());
    triggerHaptic('success'); // Haptic feedback for wishlist add

    // Update stats optimistically
    if (stats) {
      setStats(prev => prev ? {
        ...prev,
        totalItems: prev.totalItems + 1,
        availableItems: prev.availableItems + 1
      } : null);
    }

    try {
      // Backend call (non-blocking for UI)
      const newItem = await wishlistService.addToWishlist(productId, configuration, configurationPriceModifier);

      // Fix availability status by checking actual product status
      let correctedItem = newItem;
      try {
        await hybridProductService.getProductById(newItem.productId);
        correctedItem = { ...newItem, isAvailable: true };
      } catch (error) {
        if (isErrorWithCode(error) && error.code === 'PRODUCT_INACTIVE') {
          correctedItem = { ...newItem, isAvailable: false };
        }
      }

      // Replace optimistic item with real data from server
      setItems(prev => prev.map(item =>
        item.id === optimisticItem.id ? correctedItem : item
      ));

      // Update stats with correct values
      if (stats && !correctedItem.isAvailable) {
        setStats(prev => prev ? {
          ...prev,
          availableItems: prev.availableItems - 1,
          unavailableItems: prev.unavailableItems + 1
        } : null);
      }

      return true;
    } catch (err: unknown) {
      logError('Failed to add to wishlist:', err);

      // ROLLBACK: Restore previous state on error
      setItems(previousItems);
      setStats(previousStats);
      setTotalCount(previousTotalCount);

      // Handle backend errors with proper error messages
      if (isErrorWithData(err)) {
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
        } else if (err.message?.includes('5') || (err.errorData?.status !== undefined && err.errorData.status >= 500)) {
          setError('Server error, please try again');
        } else {
          setError('Unable to add to wishlist. Please try again.');
        }
      } else {
        setError('Unable to add to wishlist. Please try again.');
      }

      return false;
    }
  }, [isAuthenticated, items, stats, totalCount]);

  const removeFromWishlist = useCallback(async (productId: string | number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Please login to remove items from wishlist');
      return false;
    }

    const numericId = typeof productId === 'string' ? parseInt(productId) : productId;
    const removedItem = items.find(item => item.productId === numericId);

    if (!removedItem) {
      // Item not in wishlist, nothing to remove
      return true;
    }

    // Store previous state for rollback
    const previousItems = items;
    const previousStats = stats;
    const previousTotalCount = totalCount;

    // OPTIMISTIC UPDATE: Remove from UI immediately
    setError(null);
    setItems(prev => prev.filter(item => item.productId !== numericId));
    setTotalCount(prev => Math.max(0, prev - 1));
    setLastUpdated(new Date().toISOString());

    // Update stats optimistically
    if (stats) {
      setStats(prev => prev ? {
        ...prev,
        totalItems: Math.max(0, prev.totalItems - 1),
        availableItems: removedItem.isAvailable ? Math.max(0, prev.availableItems - 1) : prev.availableItems,
        unavailableItems: !removedItem.isAvailable ? Math.max(0, prev.unavailableItems - 1) : prev.unavailableItems,
        totalValue: removedItem.isAvailable ? Math.max(0, prev.totalValue - removedItem.productPrice) : prev.totalValue
      } : null);
    }

    try {
      // Backend call (UI already updated)
      await wishlistService.removeFromWishlist(productId);
      return true;
    } catch (err: unknown) {
      logError('Failed to remove from wishlist:', err);

      // ROLLBACK: Restore previous state on error
      setItems(previousItems);
      setStats(previousStats);
      setTotalCount(previousTotalCount);

      // Handle backend errors with proper error messages
      if (isErrorWithData(err)) {
        if (err.message?.includes('Authentication required') || err.message?.includes('session has expired')) {
          setError('Please log in to remove items from wishlist');
        } else if (err.message?.includes('401') || err.errorData?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (err.message?.includes('403') || err.errorData?.status === 403) {
          setError('You do not have permission to modify this wishlist');
        } else if (err.message?.includes('404') || err.errorData?.status === 404) {
          // Item was already removed server-side, keep optimistic state
          return true;
        } else if (err.message?.includes('5') || (err.errorData?.status !== undefined && err.errorData.status >= 500)) {
          setError('Server error, please try again');
        } else {
          setError('Unable to remove from wishlist');
        }
      } else {
        setError('Unable to remove from wishlist');
      }

      return false;
    }
  }, [isAuthenticated, items, stats, totalCount]);

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
      logError('Failed to cleanup wishlist:', err);
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
    } catch (err: unknown) {
      logError('Failed to add multiple items to wishlist:', err);

      if (isErrorWithData(err)) {
        if (err.message?.includes('Authentication required') || err.message?.includes('session has expired')) {
          setError('Please log in to add items to wishlist');
        } else if (err.message?.includes('401') || err.errorData?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError('Failed to add products to wishlist');
        }
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
    } catch (err: unknown) {
      logError('Failed to remove multiple items from wishlist:', err);

      if (isErrorWithData(err)) {
        if (err.message?.includes('Authentication required') || err.message?.includes('session has expired')) {
          setError('Please log in to remove items from wishlist');
        } else if (err.message?.includes('401') || err.errorData?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError('Failed to remove products from wishlist');
        }
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

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<WishlistContextType>(() => ({
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
  }), [
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
  ]);

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