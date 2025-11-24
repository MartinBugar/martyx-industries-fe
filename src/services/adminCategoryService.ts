import apiClient from './apiClient';
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
    const response = await apiClient.get<ProductCategory[]>(ADMIN_CATEGORY_ENDPOINT);
    return response.data;
  },

  /**
   * Get category by ID
   */
  async getCategoryById(id: number): Promise<ProductCategory> {
    const response = await apiClient.get<ProductCategory>(`${ADMIN_CATEGORY_ENDPOINT}/${id}`);
    return response.data;
  },

  /**
   * Create new category
   */
  async createCategory(category: Partial<ProductCategory>): Promise<ProductCategory> {
    const response = await apiClient.post<ProductCategory>(ADMIN_CATEGORY_ENDPOINT, category);
    return response.data;
  },

  /**
   * Update existing category
   */
  async updateCategory(id: number, category: Partial<ProductCategory>): Promise<ProductCategory> {
    const response = await apiClient.put<ProductCategory>(`${ADMIN_CATEGORY_ENDPOINT}/${id}`, category);
    return response.data;
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
    const response = await apiClient.patch<ProductCategory>(`${ADMIN_CATEGORY_ENDPOINT}/${id}/toggle-active`);
    return response.data;
  }
};
