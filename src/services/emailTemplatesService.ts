import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

export interface EmailTemplate {
  id: number;
  templateCode: string;
  templateName: string;
  subjectLine: string;
  htmlContent: string;
  placeholders: Record<string, string>;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface EmailTemplateUpdateRequest {
  templateCode?: string;
  templateName?: string;
  subjectLine?: string;
  htmlContent?: string;
  placeholders?: Record<string, string>;
  description?: string;
  isActive?: boolean;
}

export interface TestEmailRequest {
  recipientEmail: string;
  placeholderValues?: Record<string, string>;
}

export const emailTemplatesService = {
  /**
   * Get all email templates
   */
  async getAllTemplates(activeOnly: boolean = false): Promise<EmailTemplate[]> {
    const params = new URLSearchParams();
    if (activeOnly) {
      params.append('activeOnly', 'true');
    }

    const url = `${API_BASE_URL}/api/admin/email-templates${params.toString() ? '?' + params.toString() : ''}`;
    const resp = await fetch(url, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as EmailTemplate[];
  },

  /**
   * Get template by ID
   */
  async getTemplateById(id: number): Promise<EmailTemplate> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/email-templates/${id}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as EmailTemplate;
  },

  /**
   * Get template by code
   */
  async getTemplateByCode(code: string): Promise<EmailTemplate> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/email-templates/code/${code}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as EmailTemplate;
  },

  /**
   * Update email template
   */
  async updateTemplate(id: number, payload: EmailTemplateUpdateRequest): Promise<EmailTemplate> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/email-templates/${id}`, withLangHeaders({
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    }));
    return await handleResponse(resp) as EmailTemplate;
  },

  /**
   * Toggle active status
   */
  async toggleActive(id: number, isActive: boolean): Promise<EmailTemplate> {
    const params = new URLSearchParams({ isActive: isActive.toString() });
    const resp = await fetch(`${API_BASE_URL}/api/admin/email-templates/${id}/toggle-active?${params}`, withLangHeaders({
      method: 'PATCH',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as EmailTemplate;
  },

  /**
   * Preview template with placeholder values
   */
  async previewTemplate(code: string, placeholderValues?: Record<string, string>): Promise<string> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/email-templates/${code}/preview`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(placeholderValues || {}),
    }));

    if (!resp.ok) {
      throw new Error('Failed to generate preview');
    }

    return await resp.text();
  },

  /**
   * Send test email
   */
  async sendTestEmail(code: string, payload: TestEmailRequest): Promise<{ message: string; recipient: string; template: string }> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/email-templates/${code}/test`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    }));
    return await handleResponse(resp);
  },

  /**
   * Search templates
   */
  async searchTemplates(query: string): Promise<EmailTemplate[]> {
    const params = new URLSearchParams({ query });
    const resp = await fetch(`${API_BASE_URL}/api/admin/email-templates/search?${params}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as EmailTemplate[];
  },
};
