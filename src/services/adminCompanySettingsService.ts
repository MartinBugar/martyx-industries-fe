import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import type { CompanySettingsDto } from '../types/invoice';

/**
 * Admin service for managing company settings.
 * Provides CRUD operations for company settings configuration.
 * Requires ADMIN role for all operations.
 */
export const adminCompanySettingsService = {
  /**
   * Get active company settings
   * GET /api/admin/company-settings/active
   */
  async getActiveSettings(): Promise<CompanySettingsDto> {
    const resp = await fetch(
      `${API_BASE_URL}/api/admin/company-settings/active`,
      withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      })
    );
    return await handleResponse(resp) as CompanySettingsDto;
  },

  /**
   * Get company settings by ID
   * GET /api/admin/company-settings/{id}
   */
  async getById(id: number): Promise<CompanySettingsDto> {
    const resp = await fetch(
      `${API_BASE_URL}/api/admin/company-settings/${id}`,
      withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      })
    );
    return await handleResponse(resp) as CompanySettingsDto;
  },

  /**
   * Create new company settings
   * POST /api/admin/company-settings
   */
  async create(payload: Partial<CompanySettingsDto>): Promise<CompanySettingsDto> {
    const resp = await fetch(
      `${API_BASE_URL}/api/admin/company-settings`,
      withLangHeaders({
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
        body: JSON.stringify(payload),
      })
    );
    return await handleResponse(resp) as CompanySettingsDto;
  },

  /**
   * Update existing company settings
   * PUT /api/admin/company-settings/{id}
   */
  async update(id: number, payload: Partial<CompanySettingsDto>): Promise<CompanySettingsDto> {
    const resp = await fetch(
      `${API_BASE_URL}/api/admin/company-settings/${id}`,
      withLangHeaders({
        method: 'PUT',
        headers: defaultHeaders as HeadersInit,
        body: JSON.stringify(payload),
      })
    );
    return await handleResponse(resp) as CompanySettingsDto;
  },

  /**
   * Activate company settings (deactivates all others)
   * POST /api/admin/company-settings/{id}/activate
   */
  async activate(id: number): Promise<CompanySettingsDto> {
    const resp = await fetch(
      `${API_BASE_URL}/api/admin/company-settings/${id}/activate`,
      withLangHeaders({
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
      })
    );
    return await handleResponse(resp) as CompanySettingsDto;
  },

  /**
   * Check if active company settings exist
   * GET /api/admin/company-settings/check
   */
  async hasActiveSettings(): Promise<boolean> {
    try {
      const resp = await fetch(
        `${API_BASE_URL}/api/admin/company-settings/check`,
        withLangHeaders({
          method: 'GET',
          headers: defaultHeaders as HeadersInit,
        })
      );
      const data = await handleResponse(resp);
      return data && typeof data === 'object' && 'message' in data &&
             (data as {message: string}).message.includes('Active settings exist');
    } catch (error) {
      console.error('Error checking active settings:', error);
      return false;
    }
  }
};
