import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import type { ProductDto } from '../types/api';

/**
 * Service for product-related API calls with i18n support
 */
export class ProductService {
  /**
   * Get list of products with optional category filter
   * @param category - Optional category filter
   * @param language - Optional language override (defaults to current i18n language)
   * @returns Promise<ProductDto[]>
   */
  async getProducts(category?: string, language?: string): Promise<ProductDto[]> {
    const url = new URL(`${API_BASE_URL}/api/products`);
    
    if (category) {
      url.searchParams.set('category', category);
    }
    
    if (language) {
      url.searchParams.set('lang', language);
    }

    const response = await fetch(url.toString(), withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));

    return handleResponse(response);
  }

  /**
   * Get single product by ID with localized content
   * @param id - Product ID
   * @param language - Optional language override (defaults to current i18n language)
   * @returns Promise<ProductDto>
   */
  async getProduct(id: number, language?: string): Promise<ProductDto> {
    const url = new URL(`${API_BASE_URL}/api/products/${id}`);
    
    if (language) {
      url.searchParams.set('lang', language);
    }

    const response = await fetch(url.toString(), withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));

    return handleResponse(response);
  }

  /**
   * Get products by category with localized content
   * @param category - Product category
   * @param language - Optional language override
   * @returns Promise<ProductDto[]>
   */
  async getProductsByCategory(category: string, language?: string): Promise<ProductDto[]> {
    return this.getProducts(category, language);
  }
}

export const productService = new ProductService();