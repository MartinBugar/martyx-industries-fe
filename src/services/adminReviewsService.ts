import axios from 'axios';
import { Testimonial } from './testimonialService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Admin service for managing reviews (testimonials).
 * Requires ADMIN role authentication.
 */
class AdminReviewsService {
  /**
   * Get all reviews for admin management.
   * Requires ADMIN role.
   */
  async getAllReviews(): Promise<Testimonial[]> {
    try {
      const response = await axios.get<Testimonial[]>(`${API_BASE_URL}/api/admin/reviews`);
      console.log('✅ Fetched all reviews for admin:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch all reviews:', error);
      throw error;
    }
  }

  /**
   * Toggle featured status of a review.
   * Requires ADMIN role.
   */
  async toggleFeaturedStatus(reviewId: number): Promise<Testimonial> {
    try {
      const response = await axios.patch<Testimonial>(
        `${API_BASE_URL}/api/admin/reviews/${reviewId}/toggle-featured`
      );
      console.log('✅ Toggled featured status for review:', reviewId);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to toggle featured status:', error);
      throw error;
    }
  }

  /**
   * Delete a review.
   * Requires ADMIN role.
   */
  async deleteReview(productId: number, reviewId: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/api/products/${productId}/reviews/${reviewId}`);
      console.log('✅ Deleted review:', reviewId);
    } catch (error) {
      console.error('❌ Failed to delete review:', error);
      throw error;
    }
  }
}

export const adminReviewsService = new AdminReviewsService();
