import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

export interface BaseProduct {
  id?: number | string;
  name: string;
  sku?: string | null;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  description?: string | null;
  active?: boolean | null;
  productType?: 'DIGITAL' | 'PHYSICAL' | string;
  // allow extra fields from backend without tightening typing
  [key: string]: unknown;
}

export interface DigitalProduct extends BaseProduct {
  productType?: 'DIGITAL';
  // digital-specific fields (optional, unknown to FE)
}

export interface PhysicalProduct extends BaseProduct {
  productType?: 'PHYSICAL';
  // physical-specific fields (optional, unknown to FE)
}

export interface MessageResponse {
  message: string;
}

export const adminProductsService = {
  async getProducts(params?: { category?: string; active?: boolean }): Promise<BaseProduct[]> {
    const qs: string[] = [];
    if (params?.category) qs.push(`category=${encodeURIComponent(params.category)}`);
    if (typeof params?.active === 'boolean') qs.push(`active=${params.active}`);
    const url = `${API_BASE_URL}/api/admin/products${qs.length ? `?${qs.join('&')}` : ''}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    const data = await handleResponse(resp);
    return Array.isArray(data) ? (data as BaseProduct[]) : [];
  },

  async getProductById(id: string | number): Promise<BaseProduct> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    return await handleResponse(resp) as BaseProduct;
  },

  async createDigitalProduct(payload: DigitalProduct): Promise<BaseProduct> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/products/digital`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    });
    return await handleResponse(resp) as BaseProduct;
  },

  async createPhysicalProduct(payload: PhysicalProduct): Promise<BaseProduct> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/products/physical`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    });
    return await handleResponse(resp) as BaseProduct;
  },

  async updateDigitalProduct(id: string | number, payload: DigitalProduct): Promise<BaseProduct> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/products/digital/${id}`, {
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    });
    return await handleResponse(resp) as BaseProduct;
  },

  async updatePhysicalProduct(id: string | number, payload: PhysicalProduct): Promise<BaseProduct> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/products/physical/${id}`, {
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    });
    return await handleResponse(resp) as BaseProduct;
  },

  async deleteProduct(id: string | number): Promise<MessageResponse | void> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    });
    // Some backends might return 200 with body or 204
    if (resp.status === 204) return; 
    return await handleResponse(resp) as MessageResponse;
  },
};
