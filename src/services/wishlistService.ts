import { apiClient } from './apiClient';
import type {
  WishlistResponse,
  WishlistStats,
  AddToWishlistRequest,
  RemoveFromWishlistRequest,
  WishlistItem
} from '../types/wishlist';
import type { ApiResponse } from '../types/api';

export class WishlistService {
  private readonly baseUrl = '/api/wishlist';

  async getWishlist(): Promise<WishlistResponse> {
    try {
      const response = await apiClient.get<ApiResponse<WishlistResponse>>(this.baseUrl);

      // Handle backend response format according to specification
      if (response.success && response.data) {
        return response.data;
      }

      // Fallback for different response formats - response might be the data directly
      return response as unknown as WishlistResponse;
    } catch (error) {
      console.error('Failed to get wishlist:', error);
      throw error;
    }
  }

  async getStats(): Promise<WishlistStats> {
    try {
      const response = await apiClient.get<ApiResponse<WishlistStats>>(`${this.baseUrl}/stats`);

      // Handle backend response format according to specification
      if (response.success && response.data) {
        return response.data;
      }

      // Fallback for different response formats - response might be the data directly
      return response as unknown as WishlistStats;
    } catch (error) {
      console.error('Failed to get wishlist stats:', error);
      throw error;
    }
  }

  async addToWishlist(productId: string | number): Promise<WishlistItem> {
    try {
      const request: AddToWishlistRequest = {
        productId: typeof productId === 'string' ? parseInt(productId) : productId
      };

      const response = await apiClient.post<ApiResponse<WishlistItem>>(`${this.baseUrl}/add`, request);

      // Handle backend response format according to specification
      if (response.success && response.data) {
        return response.data;
      }

      // Fallback for different response formats - response might be the data directly
      return response as unknown as WishlistItem;
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      throw error;
    }
  }

  async removeFromWishlist(productId: string | number): Promise<void> {
    try {
      const request: RemoveFromWishlistRequest = {
        productId: typeof productId === 'string' ? parseInt(productId) : productId
      };

      // Use POST method for remove to avoid CORS preflight issues with DELETE+body
      await apiClient.post(`${this.baseUrl}/remove`, request);
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      throw error;
    }
  }

  async isInWishlist(productId: string | number): Promise<boolean> {
    try {
      const id = typeof productId === 'string' ? parseInt(productId) : productId;
      const response = await apiClient.get<ApiResponse<boolean>>(`${this.baseUrl}/check/${id}`);

      // Handle backend response format according to specification
      if (response.success !== undefined) {
        return response.data || false;
      }

      // Fallback for different response formats - response might be the data directly
      return response as unknown as boolean;
    } catch (error) {
      console.error('Failed to check if product in wishlist:', error);
      return false; // Return false on error rather than throwing
    }
  }

  async cleanupWishlist(): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(`${this.baseUrl}/cleanup`);

      // Handle backend response format according to specification
      if (response.success && response.data !== undefined) {
        return response.data;
      }

      // Fallback for different response formats - response might be the data directly
      return response as unknown as number;
    } catch (error) {
      console.error('Failed to cleanup wishlist:', error);
      throw error;
    }
  }

  async addMultiple(productIds: (string | number)[]): Promise<void> {
    try {
      // Convert all productIds to numbers as required by backend
      const numericIds = productIds.map(id => typeof id === 'string' ? parseInt(id) : id);
      await apiClient.post<ApiResponse<void>>(`${this.baseUrl}/bulk/add`, numericIds);
    } catch (error) {
      console.error('Failed to add multiple to wishlist:', error);
      throw error;
    }
  }

  async removeMultiple(productIds: (string | number)[]): Promise<void> {
    try {
      // Convert all productIds to numbers as required by backend
      const numericIds = productIds.map(id => typeof id === 'string' ? parseInt(id) : id);
      await apiClient.post<ApiResponse<void>>(`${this.baseUrl}/bulk/remove`, numericIds);
    } catch (error) {
      console.error('Failed to remove multiple from wishlist:', error);
      throw error;
    }
  }

}

export const wishlistService = new WishlistService();