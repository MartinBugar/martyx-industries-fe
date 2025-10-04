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

export const adminUsersService = {
  async getAllUsers(): Promise<AdminUser[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/users`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    const data = await handleResponse(resp);
    return Array.isArray(data) ? data as AdminUser[] : [];
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
