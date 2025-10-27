import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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
    const response = await axios.get<HomePageSetting[]>(
      `${API_URL}/admin/home-page-settings`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    return response.data;
  }

  /**
   * Get only visible home page settings (public)
   */
  async getVisibleSettings(): Promise<HomePageSetting[]> {
    const response = await axios.get<HomePageSetting[]>(
      `${API_URL}/public/home-page-settings`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  /**
   * Get visibility map for quick lookups (public)
   */
  async getVisibilityMap(): Promise<VisibilityMap> {
    const response = await axios.get<VisibilityMap>(
      `${API_URL}/public/home-page-settings/visibility-map`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  /**
   * Update setting visibility (admin only)
   */
  async updateVisibility(id: number, isVisible: boolean): Promise<HomePageSetting> {
    const response = await axios.patch<HomePageSetting>(
      `${API_URL}/admin/home-page-settings/${id}/visibility`,
      { isVisible },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    return response.data;
  }

  /**
   * Update setting display order (admin only)
   */
  async updateDisplayOrder(id: number, displayOrder: number): Promise<HomePageSetting> {
    const response = await axios.patch<HomePageSetting>(
      `${API_URL}/admin/home-page-settings/${id}/order`,
      { displayOrder },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    return response.data;
  }

  /**
   * Update complete setting (admin only)
   */
  async updateSetting(id: number, setting: Partial<HomePageSetting>): Promise<HomePageSetting> {
    const response = await axios.put<HomePageSetting>(
      `${API_URL}/admin/home-page-settings/${id}`,
      setting,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    return response.data;
  }

  /**
   * Bulk update multiple settings (admin only)
   */
  async bulkUpdateSettings(settings: HomePageSetting[]): Promise<HomePageSetting[]> {
    const response = await axios.put<HomePageSetting[]>(
      `${API_URL}/admin/home-page-settings/bulk`,
      settings,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    return response.data;
  }
}

export const homePageSettingsService = new HomePageSettingsService();
