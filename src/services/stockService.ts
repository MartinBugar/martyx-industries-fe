import { API_BASE_URL } from './apiUtils';
import type { CartItem } from '../context/cartContextTypes';

export interface StockValidationResult {
  valid: boolean;
  outOfStockItems: OutOfStockItem[];
  insufficientStockItems: InsufficientStockItem[];
}

export interface OutOfStockItem {
  variantId: number;
  name: string;
}

export interface InsufficientStockItem {
  variantId: number;
  name: string;
  requested: number;
  available: number;
}

export interface AvailableStockResponse {
  variantId: number;
  totalStock: number;
  reservedQuantity: number;
  availableStock: number;
}

/**
 * Service for stock validation and availability checks
 */
export const stockService = {
  /**
   * Validate that all cart items have sufficient available stock
   *
   * @param items Cart items to validate
   */
  async validateCartStock(items: CartItem[]): Promise<StockValidationResult> {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/api/stock/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        items: items.map(item => ({
          variantId: item.product.variantId,
          quantity: item.quantity
        }))
      })
    });

    if (!response.ok) {
      throw new Error('Stock validation failed');
    }

    return response.json();
  },

  /**
   * Get available stock for a specific variant (total - reserved)
   *
   * @param variantId Product variant ID
   */
  async getAvailableStock(variantId: number): Promise<AvailableStockResponse> {
    const response = await fetch(`${API_BASE_URL}/api/stock/available/${variantId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch available stock for variant ${variantId}`);
    }

    return response.json();
  },

  /**
   * Get available stock for multiple variants at once (batch)
   *
   * @param variantIds Array of variant IDs
   */
  async getAvailableStockBatch(variantIds: number[]): Promise<AvailableStockResponse[]> {
    const response = await fetch(`${API_BASE_URL}/api/stock/available/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ variantIds })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch available stock');
    }

    return response.json();
  }
};
