import { apiClient } from './apiClient';
import type { ProductCategory } from '../types/category';

/**
 * Admin service for managing product categories
 */

const ADMIN_CATEGORY_ENDPOINT = '/api/admin/categories';

export const adminCategoryService = {
  /**
   * Get all categories (including inactive) for admin panel
   */
  async getAllCategories(): Promise<ProductCategory[]> {
    return await apiClient.get<ProductCategory[]>(ADMIN_CATEGORY_ENDPOINT);
  },

  /**
   * Get category by ID
   */
  async getCategoryById(id: number): Promise<ProductCategory> {
    return await apiClient.get<ProductCategory>(`${ADMIN_CATEGORY_ENDPOINT}/${id}`);
  },

  /**
   * Create new category
   */
  async createCategory(category: Partial<ProductCategory>): Promise<ProductCategory> {
    return await apiClient.post<ProductCategory>(ADMIN_CATEGORY_ENDPOINT, category);
  },

  /**
   * Update existing category
   */
  async updateCategory(id: number, category: Partial<ProductCategory>): Promise<ProductCategory> {
    return await apiClient.put<ProductCategory>(`${ADMIN_CATEGORY_ENDPOINT}/${id}`, category);
  },

  /**
   * Delete category
   */
  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`${ADMIN_CATEGORY_ENDPOINT}/${id}`);
  },

  /**
   * Toggle category active status
   */
  async toggleActive(id: number): Promise<ProductCategory> {
    return await apiClient.patch<ProductCategory>(`${ADMIN_CATEGORY_ENDPOINT}/${id}/toggle-active`);
  }
};
