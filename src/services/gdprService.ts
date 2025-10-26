import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type { GdprConsentDto, GdprDataExportDto } from '../types/gdpr';

/**
 * Service for public GDPR compliance operations
 */

const jsonHeaders = () => defaultHeaders as HeadersInit;

export const gdprService = {
  /**
   * Retrieves all GDPR consents for the authenticated user
   * @returns List of user's consents
   */
  async getMyConsents(): Promise<GdprConsentDto[]> {
    const resp = await fetch(`${API_BASE_URL}/api/gdpr/consents/me`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as GdprConsentDto[];
  },

  /**
   * Records a new GDPR consent
   * @param dto - Consent data
   * @returns Created consent
   */
  async recordConsent(dto: GdprConsentDto): Promise<GdprConsentDto> {
    const resp = await fetch(`${API_BASE_URL}/api/gdpr/consents`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(dto),
    });

    return await handleResponse(resp) as GdprConsentDto;
  },

  /**
   * Withdraws a user's consent for a specific type
   * @param type - Consent type (MARKETING, ANALYTICS, PREFERENCES)
   * @returns Success response
   */
  async withdrawConsent(type: string): Promise<{ message: string }> {
    const resp = await fetch(`${API_BASE_URL}/api/gdpr/consents/${type}/withdraw`, {
      method: 'PUT',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp);
  },

  /**
   * Requests a data export (GDPR Right to Access)
   * @returns Created data export request
   */
  async requestDataExport(): Promise<GdprDataExportDto> {
    const resp = await fetch(`${API_BASE_URL}/api/gdpr/export-request`, {
      method: 'POST',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as GdprDataExportDto;
  },

  /**
   * Requests account deletion (GDPR Right to be Forgotten)
   * @returns Created deletion request
   */
  async requestDeletion(): Promise<GdprDataExportDto> {
    const resp = await fetch(`${API_BASE_URL}/api/gdpr/deletion-request`, {
      method: 'POST',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as GdprDataExportDto;
  },

  /**
   * Retrieves all data export and deletion requests
   * @returns List of user's data requests
   */
  async getMyDataRequests(): Promise<GdprDataExportDto[]> {
    const resp = await fetch(`${API_BASE_URL}/api/gdpr/requests/me`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as GdprDataExportDto[];
  },
};
