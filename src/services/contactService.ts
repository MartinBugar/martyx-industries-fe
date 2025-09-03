import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import type { ContactFormRequest, ContactFormResponse } from '../types/api';

/**
 * Service for contact form functionality
 */
export class ContactService {
  /**
   * Send contact form message
   * @param request - Contact form data
   * @returns Promise<ContactFormResponse>
   */
  async sendMessage(request: ContactFormRequest): Promise<ContactFormResponse> {
    const response = await fetch(`${API_BASE_URL}/api/contact/send`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(request),
    }));

    return handleResponse(response);
  }

  /**
   * Validate contact form data on frontend
   * @param formData - Form data to validate
   * @returns Array of validation error messages
   */
  validateContactForm(formData: ContactFormRequest): string[] {
    const errors: string[] = [];

    // Email validation
    if (!formData.email || formData.email.trim() === '') {
      errors.push('validation.email_required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push('validation.email_invalid');
    }

    // Subject validation
    if (!formData.subject || formData.subject.trim() === '') {
      errors.push('validation.subject_required');
    } else if (formData.subject.length > 255) {
      errors.push('validation.subject_max_length');
    }

    // Text validation
    if (!formData.text || formData.text.trim() === '') {
      errors.push('validation.text_required');
    } else if (formData.text.length > 5000) {
      errors.push('validation.text_max_length');
    }

    return errors;
  }
}

export const contactService = new ContactService();
