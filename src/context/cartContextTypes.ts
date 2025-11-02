import { createContext } from 'react';
import type { Product } from '../data/productData';

// Define the structure of a cart item
export interface CartItem {
  product: Product;
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