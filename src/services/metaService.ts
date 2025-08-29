import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type { SupportedLocales } from '../types/api';

/**
 * Service for meta endpoints like supported locales
 */
export class MetaService {
  /**
   * Get list of supported locales from backend
   * @returns Promise<string[]> - Array of supported locale codes
   */
  async getSupportedLocales(): Promise<SupportedLocales> {
    const response = await fetch(`${API_BASE_URL}/api/meta/locales`, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });

    return handleResponse(response);
  }
}

export const metaService = new MetaService();
