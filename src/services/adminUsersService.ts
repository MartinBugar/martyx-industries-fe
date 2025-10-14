import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

export interface AdminUser {
  id: string | number;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string; // some backends return a full name
  phone?: string;
  // add other fields as needed
  [key: string]: unknown;
}

export interface AdminSignupRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
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

export const adminUsersService = {
  async getAllUsers(page: number = 0, size: number = 20, sortBy: string = 'id', sortDir: string = 'DESC'): Promise<PageResponse<AdminUser>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir
    });

    const resp = await fetch(`${API_BASE_URL}/api/admin/users?${params}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    const data = await handleResponse(resp);

    // If backend returns paginated response, return it; otherwise wrap in page structure
    if (data && typeof data === 'object' && 'content' in data) {
      return data as PageResponse<AdminUser>;
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

  async getUserById(id: string | number): Promise<AdminUser> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as AdminUser;
  },

  async createUser(payload: AdminSignupRequest): Promise<AdminUser> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/users`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    }));
    return await handleResponse(resp) as AdminUser;
  },

  async updateUser(id: string | number, payload: Partial<AdminUser> & { password?: string }): Promise<AdminUser> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, withLangHeaders({
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    }));
    return await handleResponse(resp) as AdminUser;
  },

  async deleteUser(id: string | number): Promise<void> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, withLangHeaders({
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    }));
    if (resp.status === 204) return; // handle no content
    await handleResponse(resp);
  }
};
