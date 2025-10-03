// Product service for Next.js
import { apiClient } from './api';
import type { Product } from '../types/product';

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilters {
  featured?: boolean;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'newest' | 'popular';
  sortOrder?: 'asc' | 'desc';
}

export const productService = {
  // Get all products with optional filters
  getProducts: async (filters: ProductFilters = {}, page = 1, limit = 12): Promise<ProductsResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, String(value)])
        )
      });

      const data = await apiClient.get(`/api/products?${params}`);
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get featured products
  getFeaturedProducts: async (): Promise<Product[]> => {
    try {
      const data = await apiClient.get('/api/products?featured=true');
      return data.products || data;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  },

  // Get single product by ID
  getProductById: async (id: string): Promise<Product> => {
    try {
      const data = await apiClient.get(`/api/products/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  },

  // Get single product by slug
  getProductBySlug: async (slug: string): Promise<Product> => {
    try {
      const data = await apiClient.get(`/api/products/slug/${slug}`);
      return data;
    } catch (error) {
      console.error(`Error fetching product by slug ${slug}:`, error);
      throw error;
    }
  },

  // Get product categories
  getCategories: async (): Promise<string[]> => {
    try {
      const data = await apiClient.get('/api/products/categories');
      return data.categories || data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Search products
  searchProducts: async (query: string, page = 1, limit = 12): Promise<ProductsResponse> => {
    try {
      const params = new URLSearchParams({
        search: query,
        page: page.toString(),
        limit: limit.toString()
      });

      const data = await apiClient.get(`/api/products/search?${params}`);
      return data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // Get product reviews
  getProductReviews: async (productId: string, page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const data = await apiClient.get(`/api/products/${productId}/reviews?${params}`);
      return data;
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
      throw error;
    }
  },

  // Add product review
  addProductReview: async (productId: string, review: {
    rating: number;
    comment: string;
    title?: string;
  }) => {
    try {
      const data = await apiClient.post(`/api/products/${productId}/reviews`, review);
      return data;
    } catch (error) {
      console.error(`Error adding review for product ${productId}:`, error);
      throw error;
    }
  },

  // Get related products
  getRelatedProducts: async (productId: string, limit = 4): Promise<Product[]> => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      const data = await apiClient.get(`/api/products/${productId}/related?${params}`);
      return data.products || data;
    } catch (error) {
      console.error(`Error fetching related products for ${productId}:`, error);
      throw error;
    }
  },
};
