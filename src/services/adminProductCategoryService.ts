/**
 * Admin API service for product-category assignments
 */

import { apiClient } from './apiClient';
import type { ProductCategory } from '../types/category';

export const adminProductCategoryService = {
    /**
     * Get categories assigned to a product
     */
    async getProductCategories(productId: number): Promise<ProductCategory[]> {
        return await apiClient.get<ProductCategory[]>(
            `/api/admin/products/${productId}/categories`
        );
    },

    /**
     * Assign categories to a product (replaces existing)
     */
    async assignCategories(productId: number, categoryIds: number[]): Promise<void> {
        await apiClient.put(
            `/api/admin/products/${productId}/categories`,
            categoryIds
        );
    },

    /**
     * Add a single category to a product
     */
    async addCategory(productId: number, categoryId: number): Promise<void> {
        await apiClient.post(
            `/api/admin/products/${productId}/categories/${categoryId}`
        );
    },

    /**
     * Remove a category from a product
     */
    async removeCategory(productId: number, categoryId: number): Promise<void> {
        await apiClient.delete(
            `/api/admin/products/${productId}/categories/${categoryId}`
        );
    }
};
