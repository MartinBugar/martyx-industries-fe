import { createContext } from 'react';
import type { Product } from '../data/productData';

// Cart product contains only the fields we get from the backend
// This is a subset of the full Product type
export interface CartProduct {
  variantId: number;
  masterProductId: number;
  name: string;
  variantName: string;
  priceWithVat: number;
  imageUrl?: string;
  availabilityStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER' | 'DISCONTINUED' | 'BACKORDERED';
  stockQuantity: number;
  variantType: 'DIGITAL_ONLY' | 'PHYSICAL_ONLY' | 'HYBRID';
  // Additional fields used by cart UI
  sku?: string;
  gallery?: string[];
  currency?: string;
  requiresShipping?: boolean;
  vatRate?: number;
}

// Define the structure of a cart item
export interface CartItem {
  product: CartProduct;
  quantity: number;
  addedAt: number; // Unix timestamp (ms) when item was added to cart
}

// Define the shape of the cart context
export interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => 'added' | 'limit' | 'out_of_stock' | 'discontinued' | 'pre_order';
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  mergeCart: () => Promise<boolean>;
}

// Create the context with a default value
export const CartContext = createContext<CartContextType | undefined>(undefined);