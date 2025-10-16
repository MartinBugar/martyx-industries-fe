import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

export interface AdminContact {
  id: number;
  email: string;
  subject: string;
  text: string;
  processed: boolean;
  ipAddress?: string;
  createdAt: string;
  updatedAt?: string;
}

// Spring Data Page response interface
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const adminContactsService = {
  async getAllContacts(page: number = 0, size: number = 20, sortBy: string = 'createdAt', sortDir: string = 'DESC'): Promise<PageResponse<AdminContact>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir
    });

    const resp = await fetch(`${API_BASE_URL}/api/admin/contacts?${params}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    const data = await handleResponse(resp);

    // If backend returns paginated response, return it; otherwise wrap in page structure
    if (data && typeof data === 'object' && 'content' in data) {
      return data as PageResponse<AdminContact>;
    }

    // Fallback for non-paginated response (backward compatibility)
    return {
      content: Array.isArray(data) ? data : [],
      totalElements: Array.isArray(data) ? data.length : 0,
      totalPages: 1,
      size: Array.isArray(data) ? data.length : 0,
      number: 0,
      first: true,
      last: true
    };
  },

  async getContactById(id: number): Promise<AdminContact> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/contacts/${id}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as AdminContact;
  },

  async updateContact(id: number, payload: Partial<AdminContact>): Promise<AdminContact> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/contacts/${id}`, withLangHeaders({
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    }));
    return await handleResponse(resp) as AdminContact;
  },

  async deleteContact(id: number): Promise<void> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/contacts/${id}`, withLangHeaders({
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    }));
    if (resp.status === 204) return; // handle no content
    await handleResponse(resp);
  },

  async markAsProcessed(id: number): Promise<AdminContact> {
    return this.updateContact(id, { processed: true });
  },

  async markAsUnprocessed(id: number): Promise<AdminContact> {
    return this.updateContact(id, { processed: false });
  }
};
