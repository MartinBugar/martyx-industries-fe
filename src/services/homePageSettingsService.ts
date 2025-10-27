import { API_BASE_URL, handleResponse, withLangHeaders } from './apiUtils';

export interface HomePageSetting {
  id: number;
  sectionKey: string;
  sectionName: string;
  isVisible: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VisibilityMap {
  [sectionKey: string]: boolean;
}

/**
 * Service for managing home page settings
 */
class HomePageSettingsService {
  /**
   * Get all home page settings (admin only)
   */
  async getAllSettings(): Promise<HomePageSetting[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/home-page-settings`,
      withLangHeaders({
        method: 'GET',
        credentials: 'include'
      })
    );
    return handleResponse(response);
  }

  /**
   * Get only visible home page settings (public)
   */
  async getVisibleSettings(): Promise<HomePageSetting[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/public/home-page-settings`,
      withLangHeaders({
        method: 'GET'
      })
    );
    return handleResponse(response);
  }

  /**
   * Get visibility map for quick lookups (public)
   */
  async getVisibilityMap(): Promise<VisibilityMap> {
    const response = await fetch(
      `${API_BASE_URL}/api/public/home-page-settings/visibility-map`,
      withLangHeaders({
        method: 'GET'
      })
    );
    return handleResponse(response);
  }

  /**
   * Update setting visibility (admin only)
   */
  async updateVisibility(id: number, isVisible: boolean): Promise<HomePageSetting> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/home-page-settings/${id}/visibility`,
      withLangHeaders({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ isVisible })
      })
    );
    return handleResponse(response);
  }

  /**
   * Update setting display order (admin only)
   */
  async updateDisplayOrder(id: number, displayOrder: number): Promise<HomePageSetting> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/home-page-settings/${id}/order`,
      withLangHeaders({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ displayOrder })
      })
    );
    return handleResponse(response);
  }

  /**
   * Update complete setting (admin only)
   */
  async updateSetting(id: number, setting: Partial<HomePageSetting>): Promise<HomePageSetting> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/home-page-settings/${id}`,
      withLangHeaders({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(setting)
      })
    );
    return handleResponse(response);
  }

  /**
   * Bulk update multiple settings (admin only)
   */
  async bulkUpdateSettings(settings: HomePageSetting[]): Promise<HomePageSetting[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/home-page-settings/bulk`,
      withLangHeaders({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      })
    );
    return handleResponse(response);
  }
}

export const homePageSettingsService = new HomePageSettingsService();
