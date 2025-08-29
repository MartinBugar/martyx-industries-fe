import { apiClient } from './apiClient';

/**
 * ProductDto interface matching the backend API response
 * This represents the data structure returned by /api/products endpoints
 */
export interface ProductDto {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  sku: string;
  category: string | null;
  productType: 'DIGITAL' | 'PHYSICAL';
  active: boolean;
}

/**
 * Service for fetching products from the new backend API
 */
export const productService = {
  /**
   * Get all products with optional category filter
   * GET /api/products?category=...
   */
  async getProducts(category?: string): Promise<ProductDto[]> {
    const endpoint = category 
      ? `/api/products?category=${encodeURIComponent(category)}`
      : '/api/products';
    
    return apiClient.get<ProductDto[]>(endpoint, { 
      cache: true,
      retry: true 
    });
  },

  /**
   * Get a single product by ID
   * GET /api/products/{id}
   * Returns ProductDto if found and active, throws error if 404
   */
  async getProductById(id: number): Promise<ProductDto> {
    return apiClient.get<ProductDto>(`/api/products/${id}`, { 
      cache: true,
      retry: true 
    });
  }
};
