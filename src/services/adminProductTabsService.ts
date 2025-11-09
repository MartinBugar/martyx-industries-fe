import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

/**
 * Service for admin product tab management operations
 */

export interface ProductTabTemplateDto {
  id: number;
  template_name: string;
  template_key: string;
  default_tab_key: string;
  default_tab_label: string;
  content_type: 'HTML' | 'MARKDOWN' | 'JSON' | 'COMPONENT';
  default_content_html?: string;
  default_content_markdown?: string;
  default_content_json?: string;
  default_component_name?: string;
  default_icon_name?: string;
  default_display_order: number;
  description?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const jsonHeaders = () => defaultHeaders as HeadersInit;

export const adminProductTabsService = {
  /**
   * Get all active tab templates
   * @returns List of all active templates
   */
  async getAllActiveTemplates(): Promise<ProductTabTemplateDto[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/product-tabs/templates`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ProductTabTemplateDto[];
  },
};
