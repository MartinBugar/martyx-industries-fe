import { API_BASE_URL, handleResponse, withLangHeaders } from './apiUtils';

export interface Testimonial {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  productName?: string;
  helpfulCount?: number;
  isFeatured?: boolean;
}

/**
 * Service for fetching featured testimonials (reviews) from the backend.
 * Featured reviews are hand-picked high-quality reviews displayed on the homepage.
 */
class TestimonialService {
  /**
   * Fetch featured testimonials for the homepage.
   * Public endpoint - no authentication required.
   *
   * @returns Promise<Testimonial[]> Array of featured reviews
   */
  async getFeaturedTestimonials(): Promise<Testimonial[]> {
    console.log('🌐 [TESTIMONIAL_SERVICE] Calling API:', `${API_BASE_URL}/api/reviews/featured`);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reviews/featured`,
        withLangHeaders({
          method: 'GET'
        })
      );
      const data = await handleResponse(response);
      console.log('✅ [TESTIMONIAL_SERVICE] Fetched testimonials:', data?.length || 0, data);
      return data || [];
    } catch (error) {
      console.error('❌ [TESTIMONIAL_SERVICE] Failed to fetch:', error);
      // Return empty array on error - don't break the homepage
      return [];
    }
  }
}

// Export singleton instance
export const testimonialService = new TestimonialService();
