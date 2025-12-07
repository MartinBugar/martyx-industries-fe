import { apiClient } from './apiClient';
import type {
  WishlistResponse,
  WishlistStats,
  AddToWishlistRequest,
  RemoveFromWishlistRequest,
  WishlistItem,
  WishlistConfigurationOption
} from '../types/wishlist';
import type { ApiResponse } from '../types/api';
import { logError } from '../services/logger';

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
      logError('Failed to get wishlist:', error);
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
      logError('Failed to get wishlist stats:', error);
      throw error;
    }
  }

  async addToWishlist(
    productId: string | number,
    configuration?: Record<string, WishlistConfigurationOption>,
    configurationPriceModifier?: number
  ): Promise<WishlistItem> {
    try {
      const request: AddToWishlistRequest = {
        productId: typeof productId === 'string' ? parseInt(productId) : productId,
        configuration,
        configurationPriceModifier
      };

      const response = await apiClient.post<ApiResponse<WishlistItem>>(`${this.baseUrl}/add`, request);

      // Handle backend response format according to specification
      if (response.success && response.data) {
        return response.data;
      }

      // Fallback for different response formats - response might be the data directly
      return response as unknown as WishlistItem;
    } catch (error) {
      logError('Failed to add to wishlist:', error);
      throw error;
    }
  }

  async removeFromWishlist(productId: string | number): Promise<void> {
    try {
      const request: RemoveFromWishlistRequest = {
        productId: typeof productId === 'string' ? parseInt(productId) : productId
      };

      // Use DELETE method with request body as specified in backend requirements
      await apiClient.request(`${this.baseUrl}/remove`, {
        method: 'DELETE',
        body: request,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      logError('Failed to remove from wishlist:', error);
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
      logError('Failed to check if product in wishlist:', error);
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
      logError('Failed to cleanup wishlist:', error);
      throw error;
    }
  }

  async addMultiple(productIds: (string | number)[]): Promise<void> {
    try {
      // Convert all productIds to numbers as required by backend
      const numericIds = productIds.map(id => typeof id === 'string' ? parseInt(id) : id);
      await apiClient.post<ApiResponse<void>>(`${this.baseUrl}/bulk/add`, numericIds);
    } catch (error) {
      logError('Failed to add multiple to wishlist:', error);
      throw error;
    }
  }

  async removeMultiple(productIds: (string | number)[]): Promise<void> {
    try {
      // Convert all productIds to numbers as required by backend
      const numericIds = productIds.map(id => typeof id === 'string' ? parseInt(id) : id);
      await apiClient.post<ApiResponse<void>>(`${this.baseUrl}/bulk/remove`, numericIds);
    } catch (error) {
      logError('Failed to remove multiple from wishlist:', error);
      throw error;
    }
  }

}

export const wishlistService = new WishlistService();