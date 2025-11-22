import type { Testimonial } from './testimonialService';
import { apiClient } from './apiClient';
import { logInfo, logError } from '../services/logger';

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

/**
 * Admin service for managing reviews (testimonials).
 * Requires ADMIN role authentication.
 * Uses apiClient which automatically includes JWT authentication headers.
 */
class AdminReviewsService {
  /**
   * Get all reviews for admin management with pagination.
   * Requires ADMIN role.
   */
  async getAllReviews(page = 0, size = 100): Promise<Testimonial[]> {
    try {
      const response = await apiClient.get<PageResponse<Testimonial>>(
        `/api/admin/reviews?page=${page}&size=${size}&sortBy=createdAt&sortDir=DESC`
      );
      logInfo('✅ Fetched all reviews for admin:', response.content.length);
      return response.content;
    } catch (error) {
      logError('❌ Failed to fetch all reviews:', error);
      throw error;
    }
  }

  /**
   * Toggle featured status of a review.
   * Requires ADMIN role.
   */
  async toggleFeaturedStatus(reviewId: number): Promise<Testimonial> {
    try {
      const response = await apiClient.patch<Testimonial>(
        `/api/admin/reviews/${reviewId}/toggle-featured`
      );
      logInfo('✅ Toggled featured status for review:', reviewId);
      return response;
    } catch (error) {
      logError('❌ Failed to toggle featured status:', error);
      throw error;
    }
  }

  /**
   * Delete a review.
   * Requires ADMIN role.
   */
  async deleteReview(productId: number, reviewId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/products/${productId}/reviews/${reviewId}`);
      logInfo('✅ Deleted review:', reviewId);
    } catch (error) {
      logError('❌ Failed to delete review:', error);
      throw error;
    }
  }
}

export const adminReviewsService = new AdminReviewsService();
