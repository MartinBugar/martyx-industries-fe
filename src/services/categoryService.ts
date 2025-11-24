import apiClient from './apiClient';
import type { ProductCategory } from '../types/category';

/**
 * Service for fetching product categories
 * Used by CategoryBar component
 */

const CATEGORY_ENDPOINT = '/api/categories';

export const categoryService = {
  /**
   * Get all active categories for category bar
   * Returns: [3D Printed Models, Tools, Merchandise]
   */
  async getAllCategories(): Promise<ProductCategory[]> {
    const response = await apiClient.get<ProductCategory[]>(CATEGORY_ENDPOINT);
    return response.data;
  },

  /**
   * Get category by slug (for SEO URLs)
   * Example: /products/3d-printed-models
   */
  async getCategoryBySlug(slug: string): Promise<ProductCategory> {
    const response = await apiClient.get<ProductCategory>(`${CATEGORY_ENDPOINT}/${slug}`);
    return response.data;
  }
};
