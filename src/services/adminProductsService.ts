import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

export interface BaseProduct {
  id?: number | string;
  name: string;
  sku?: string | null;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  active?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  productType?: 'DIGITAL' | 'PHYSICAL' | string;
  // allow extra fields from backend without tightening typing
  [key: string]: unknown;
}

export interface DigitalProduct extends BaseProduct {
  productType?: 'DIGITAL';
  downloadUrl?: string | null;
  fileSize?: number | null; // bytes
  fileFormat?: string | null;
  licenseInfo?: string | null;
  version?: string | null;
  fileContent?: unknown; // not edited in UI; may be base64/byte[] representation
  fileName?: string | null;
}

export interface PhysicalProduct extends BaseProduct {
  productType?: 'PHYSICAL';
  stockQuantity?: number | null;
  weight?: number | null; // grams
  dimensions?: string | null; // "LxWxH" in cm
  material?: string | null;
  countryOfOrigin?: string | null;
  shippingTime?: number | null; // days
}

export interface MessageResponse {
  message: string;
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

export const adminProductsService = {
  async getProducts(
    params?: { category?: string; active?: boolean },
    page: number = 0,
    size: number = 20,
    sortBy: string = 'id',
    sortDir: string = 'DESC'
  ): Promise<PageResponse<BaseProduct>> {
    const qs: string[] = [];
    if (params?.category) qs.push(`category=${encodeURIComponent(params.category)}`);
    if (typeof params?.active === 'boolean') qs.push(`active=${params.active}`);
    qs.push(`page=${page}`);
    qs.push(`size=${size}`);
    qs.push(`sortBy=${sortBy}`);
    qs.push(`sortDir=${sortDir}`);

    const url = `${API_BASE_URL}/api/admin/products?${qs.join('&')}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    const data = await handleResponse(resp);

    // If backend returns paginated response, return it; otherwise wrap in page structure
    if (data && typeof data === 'object' && 'content' in data) {
      return data as PageResponse<BaseProduct>;
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
    // Some backends may return 204 No Content for successful updates
    if (resp.status === 204) {
      return await adminProductsService.getProductById(id);
    }
    return await handleResponse(resp) as BaseProduct;
  },

  async updatePhysicalProduct(id: string | number, payload: PhysicalProduct): Promise<BaseProduct> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/products/physical/${id}`, {
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(payload),
    });
    // Some backends may return 204 No Content for successful updates
    if (resp.status === 204) {
      return await adminProductsService.getProductById(id);
    }
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
