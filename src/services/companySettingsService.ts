import { API_BASE_URL, handleResponse, withLangHeaders } from './apiUtils';
import type { CompanySettingsDto } from '../types/invoice';

/**
 * Service for fetching public company settings.
 * Used for contact pages, footers, etc.
 */
export class CompanySettingsService {
  /**
   * Fetch company settings from public endpoint
   * @returns CompanySettingsDto with company information
   */
  async getCompanySettings(): Promise<CompanySettingsDto> {
    const response = await fetch(
      `${API_BASE_URL}/api/public/company-settings`,
      withLangHeaders({
        method: 'GET',
      })
    );

    return handleResponse(response);
  }
}

export const companySettingsService = new CompanySettingsService();
