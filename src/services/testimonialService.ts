import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
    try {
      const response = await axios.get<Testimonial[]>(`${API_BASE_URL}/api/reviews/featured`);
      console.log('✅ Fetched featured testimonials:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch featured testimonials:', error);
      // Return empty array on error - don't break the homepage
      return [];
    }
  }
}

// Export singleton instance
export const testimonialService = new TestimonialService();

// Re-export type for convenience
export type { Testimonial };
