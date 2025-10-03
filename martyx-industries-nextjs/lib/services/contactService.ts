// Contact service for Next.js
import { apiClient } from './api';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  company?: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  id?: string;
}

export const contactService = {
  // Submit contact form
  submitContactForm: async (formData: ContactFormData): Promise<ContactResponse> => {
    try {
      const data = await apiClient.post('/api/contact/send', formData);
      return {
        success: true,
        message: data.message || 'Message sent successfully',
        id: data.id
      };
    } catch (error: unknown) {
      console.error('Error submitting contact form:', error);
      
      // Return structured error response
      return {
        success: false,
        message: (error as Error & { data?: { message?: string } })?.data?.message || (error as Error)?.message || 'Failed to send message. Please try again.'
      };
    }
  },

  // Get contact information (if available from backend)
  getContactInfo: async () => {
    try {
      const data = await apiClient.get('/api/contact/info');
      return data;
    } catch (error) {
      console.error('Error fetching contact info:', error);
      // Return default contact info if backend is not available
      return {
        email: 'info@martyx-industries.com',
        phone: '+421 XXX XXX XXX',
        address: 'Slovakia',
        businessHours: 'Mon-Fri 9:00-17:00 CET'
      };
    }
  },

  // Get FAQ data (if available from backend)
  getFAQ: async () => {
    try {
      const data = await apiClient.get('/api/contact/faq');
      return data.faqs || data;
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      // Return empty array if backend is not available
      return [];
    }
  },
};
