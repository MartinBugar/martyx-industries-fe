// Wishlist types matching backend API specification
export interface WishlistItem {
  id: number;
  productId: number; // Backend uses number, not string
  productName: string;
  productDescription: string;
  productPrice: number;
  productCurrency: string;
  productImageUrl?: string;
  productType: 'physical' | 'digital'; // Backend uses lowercase
  addedAt: string; // ISO date string
  isAvailable: boolean;
  hasMultipleVariants: boolean;
}

export interface WishlistResponse {
  items: WishlistItem[];
  totalCount: number;
  lastUpdated: string; // ISO date string
}

export interface WishlistStats {
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
  totalValue: number;
  currency: string;
}

export interface AddToWishlistRequest {
  productId: number; // Backend expects number
}

export interface RemoveFromWishlistRequest {
  productId: number; // Backend expects number
}

export interface WishlistContextType {
  items: WishlistItem[];
  stats: WishlistStats | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  lastUpdated: string | null;

  // Actions - support both string and number productIds for convenience
  addToWishlist: (productId: string | number) => Promise<boolean>;
  removeFromWishlist: (productId: string | number) => Promise<boolean>;
  isInWishlist: (productId: string | number) => boolean;
  loadWishlist: () => Promise<void>;
  loadStats: () => Promise<void>;
  cleanupWishlist: () => Promise<number>;
  addMultiple: (productIds: (string | number)[]) => Promise<void>;
  removeMultiple: (productIds: (string | number)[]) => Promise<void>;
  clearError: () => void;
  refreshWishlist: () => Promise<void>; // Helper to refresh both wishlist and stats
}