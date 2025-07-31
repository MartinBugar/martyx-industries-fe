import { createContext } from 'react';
import type { Product } from '../data/productData';

// Define the structure of a cart item
export interface CartItem {
  product: Product;
  quantity: number;
}

// Define the shape of the cart context
export interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// Create the context with a default value
export const CartContext = createContext<CartContextType | undefined>(undefined);